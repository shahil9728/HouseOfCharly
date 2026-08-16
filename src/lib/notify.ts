import "server-only";
import { inr } from "./format";
import { SITE } from "./site";

/* ---------------------------------------------------------------------------
 * Order notifications.
 *
 * An order that nobody is told about is a lost sale, so this deliberately
 * favours redundancy over elegance: every configured channel is attempted, in
 * parallel, and one failing never stops the others.
 *
 * Three independent channels, each switched on purely by setting its env vars:
 *
 *   1. WEBHOOK  (ORDERS_WEBHOOK_URL)  — Google Apps Script → "Orders" tab + email.
 *                                       The durable record. See docs/orders-apps-script.js
 *   2. EMAIL    (RESEND_API_KEY)      — direct HTML email via Resend's HTTP API.
 *   3. TELEGRAM (TELEGRAM_BOT_TOKEN)  — instant push to your phone, genuinely free.
 *
 * Design rules, learned from the fact that this shop has already been taking
 * COD orders with nowhere for them to land:
 *
 *   - Nothing here can throw. A notification outage must never fail an order
 *     the customer has already paid for or committed to.
 *   - Every channel is time-boxed. A hung third party must not hold the
 *     customer on a spinner — they have done their part.
 *   - Channels run concurrently, so three channels cost one channel's latency.
 *   - If NO channel is configured we log loudly, at error level, with the whole
 *     order serialised, because at that point the server log is the only copy
 *     that exists.
 *
 * No SDKs — every channel is a plain HTTPS POST via fetch. Nothing to install,
 * nothing to keep patched, and it works unchanged on any host.
 * ------------------------------------------------------------------------- */

export interface OrderLineRecord {
  sku: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface OrderRecord {
  ref?: string;
  placedAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  customer?: Record<string, string | undefined>;
  lines?: OrderLineRecord[];
  subtotal?: number;
  shipping?: number;
  total?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

/** Per-channel budget. Long enough for a cold Apps Script, short enough that a
    dead endpoint doesn't leave the customer staring at a spinner. */
const CHANNEL_TIMEOUT_MS = 8000;

type ChannelResult = { channel: string; ok: boolean; detail?: string };

/* ------------------------------- formatting ------------------------------ */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function customerBlock(o: OrderRecord) {
  const c = o.customer ?? {};
  return {
    name: c.name || "—",
    phone: c.phone || "—",
    address: [c.address, c.city, c.pin].filter(Boolean).join(", ") || "—",
    note: c.note || ""
  };
}

/** Payment shown as one unambiguous phrase — "cod / pending" invites a
    misread, and COD vs already-paid changes what you do next. */
function paymentLabel(o: OrderRecord) {
  if (o.paymentMethod === "cod") return "Cash on Delivery — COLLECT ON DELIVERY";
  if (o.paymentStatus === "paid") return "Paid online (Razorpay)";
  return `${o.paymentMethod ?? "unknown"} / ${o.paymentStatus ?? "unknown"}`;
}

/** Plain text, used for Telegram and as the email's text fallback. */
export function orderAsText(o: OrderRecord) {
  const c = customerBlock(o);
  const items = (o.lines ?? [])
    .map((l) => `• ${l.name} (${l.sku}) x${l.qty} = ${inr(l.lineTotal)}`)
    .join("\n");

  return [
    `NEW ORDER — ${o.ref ?? "(no ref)"}`,
    "",
    `Total: ${inr(o.total ?? 0)}`,
    `Payment: ${paymentLabel(o)}`,
    "",
    "CUSTOMER",
    `Name:  ${c.name}`,
    `Phone: ${c.phone}`,
    `Address: ${c.address}`,
    c.note ? `Notes: ${c.note}` : "",
    "",
    "ITEMS",
    items || "(none)",
    "",
    `Subtotal: ${inr(o.subtotal ?? 0)}`,
    `Delivery: ${o.shipping ? inr(o.shipping) : "FREE"}`,
    `TOTAL:    ${inr(o.total ?? 0)}`,
    o.razorpayPaymentId ? `\nRazorpay payment: ${o.razorpayPaymentId}` : "",
    o.placedAt ? `\nPlaced: ${new Date(o.placedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : ""
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function orderAsHtml(o: OrderRecord) {
  const c = customerBlock(o);
  const rows = (o.lines ?? [])
    .map(
      (l) => `<tr>
        <td style="padding:7px 0;border-bottom:1px solid #eee">${esc(l.name)}<br>
          <span style="color:#888;font-size:12px">${esc(l.sku)}</span></td>
        <td style="padding:7px 0;border-bottom:1px solid #eee;text-align:center">${l.qty}</td>
        <td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right">${inr(l.lineTotal)}</td>
      </tr>`
    )
    .join("");

  /* Phone as a tel: link — the point of this email is that you can act on it
     from a phone without retyping anything. */
  return `<!doctype html><html><body style="margin:0;background:#f6f4f0;padding:24px;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e7e2da">
      <div style="background:#14100E;color:#fff;padding:18px 22px">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#C9BEB1">New order</div>
        <div style="font-size:24px;margin-top:4px">${esc(o.ref ?? "")}</div>
      </div>
      <div style="padding:22px">
        <p style="margin:0 0 4px;font-size:26px;font-weight:600">${inr(o.total ?? 0)}</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b6560">${esc(paymentLabel(o))}</p>

        <h3 style="margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#6b6560">Customer</h3>
        <p style="margin:0 0 18px;line-height:1.6;font-size:15px">
          <strong>${esc(c.name)}</strong><br>
          <a href="tel:${esc(c.phone)}" style="color:#1c1917">${esc(c.phone)}</a><br>
          ${esc(c.address)}
          ${c.note ? `<br><span style="color:#6b6560">Notes: ${esc(c.note)}</span>` : ""}
        </p>

        <h3 style="margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#6b6560">Items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>

        <table style="width:100%;margin-top:14px;font-size:14px">
          <tr><td>Subtotal</td><td style="text-align:right">${inr(o.subtotal ?? 0)}</td></tr>
          <tr><td>Delivery</td><td style="text-align:right">${o.shipping ? inr(o.shipping) : "FREE"}</td></tr>
          <tr><td style="padding-top:6px;font-weight:600;font-size:16px">Total</td>
              <td style="padding-top:6px;text-align:right;font-weight:600;font-size:16px">${inr(o.total ?? 0)}</td></tr>
        </table>

        ${o.razorpayPaymentId ? `<p style="margin-top:16px;font-size:12px;color:#6b6560">Razorpay payment: ${esc(o.razorpayPaymentId)}</p>` : ""}
      </div>
    </div>
    <p style="max-width:600px;margin:12px auto 0;font-size:12px;color:#8a827a">
      Sent automatically by ${esc(SITE.name)} — ${esc(SITE.url)}
    </p>
  </body></html>`;
}

/* -------------------------------- channels ------------------------------- */

async function post(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(CHANNEL_TIMEOUT_MS) });
}

/** The durable record: Apps Script appends to the sheet AND emails a copy. */
async function sendWebhook(o: OrderRecord): Promise<ChannelResult> {
  const url = process.env.ORDERS_WEBHOOK_URL;
  if (!url) return { channel: "webhook", ok: false, detail: "not configured" };
  const res = await post(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(o)
  });
  /* Apps Script answers 302 to its final /exec payload; fetch follows it, so a
     non-ok here is a real failure rather than the usual redirect noise. */
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { channel: "webhook", ok: true };
}

async function sendEmail(o: OrderRecord): Promise<ChannelResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_EMAIL_TO || SITE.email;
  /* Resend's shared sender works with no DNS setup, but only delivers to the
     address that owns the Resend account. Verify the domain and switch this to
     orders@houseofcharly.com to send anywhere. */
  const from = process.env.ORDER_EMAIL_FROM || "House of Charly <onboarding@resend.dev>";
  if (!key) return { channel: "email", ok: false, detail: "not configured" };

  const res = await post("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      subject: `New order ${o.ref ?? ""} — ${inr(o.total ?? 0)}${o.paymentMethod === "cod" ? " (COD)" : " (paid)"}`,
      html: orderAsHtml(o),
      text: orderAsText(o),
      /* So you can hit reply and be talking to nobody by accident — replies
         come back to the shop address rather than to Resend. */
      reply_to: SITE.email
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { channel: "email", ok: true };
}

/** Instant push to your phone. Free, unlimited, and the fastest of the three. */
async function sendTelegram(o: OrderRecord): Promise<ChannelResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { channel: "telegram", ok: false, detail: "not configured" };

  const c = customerBlock(o);
  const items = (o.lines ?? [])
    .map((l) => `• ${esc(l.name)} ×${l.qty} — ${inr(l.lineTotal)}`)
    .join("\n");

  const text =
    `🛒 <b>NEW ORDER</b>  <code>${esc(o.ref ?? "")}</code>\n` +
    `<b>${inr(o.total ?? 0)}</b> — ${esc(paymentLabel(o))}\n\n` +
    `👤 <b>${esc(c.name)}</b>\n` +
    `📞 <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>\n` +
    `📍 ${esc(c.address)}\n` +
    (c.note ? `📝 ${esc(c.note)}\n` : "") +
    `\n${items}\n\n` +
    `Subtotal ${inr(o.subtotal ?? 0)} · Delivery ${o.shipping ? inr(o.shipping) : "FREE"}`;

  const res = await post(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { channel: "telegram", ok: true };
}

/* --------------------------------- fan-out -------------------------------- */

/**
 * Fires every configured channel concurrently. Always resolves — the caller is
 * mid-checkout and must not be made to care whether Telegram was reachable.
 */
export async function notifyOrder(o: OrderRecord): Promise<ChannelResult[]> {
  /* Names are written out rather than read from `fn.name`: the production
     minifier renames these functions, which turned a failure log into
     "l: Error: HTTP 500" — useless at exactly the moment you need it. */
  const channels: [string, (o: OrderRecord) => Promise<ChannelResult>][] = [
    ["webhook", sendWebhook],
    ["email", sendEmail],
    ["telegram", sendTelegram]
  ];

  const settled = await Promise.allSettled(channels.map(([, fn]) => fn(o)));
  const results: ChannelResult[] = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { channel: channels[i][0], ok: false, detail: String(s.reason) }
  );

  const delivered = results.filter((r) => r.ok);
  const configured = results.filter((r) => r.detail !== "not configured");

  if (configured.length === 0) {
    // The server log is now the ONLY copy of this order. Say so, loudly.
    console.error(
      "[order] NO NOTIFICATION CHANNEL CONFIGURED — this order exists nowhere but this log line. " +
        "Set ORDERS_WEBHOOK_URL, RESEND_API_KEY or TELEGRAM_BOT_TOKEN. See docs/ORDER-NOTIFICATIONS.md\n" +
        JSON.stringify(o)
    );
  } else if (delivered.length === 0) {
    console.error(
      `[order] ALL notification channels FAILED for ${o.ref} — order details follow so they are not lost.\n` +
        results.map((r) => `  ${r.channel}: ${r.detail}`).join("\n") +
        "\n" + JSON.stringify(o)
    );
  } else {
    const failed = results.filter((r) => !r.ok && r.detail !== "not configured");
    console.info(`[order] ${o.ref} notified via: ${delivered.map((r) => r.channel).join(", ")}`);
    // A partial failure still deserves a line — it is how you notice Telegram
    // has been silently down for a week.
    for (const f of failed) console.warn(`[order] channel ${f.channel} failed: ${f.detail}`);
  }

  return results;
}
