import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getProducts } from "./sheet";
import { SITE } from "./site";
import { notifyOrder, type OrderRecord } from "./notify";

export type { OrderRecord } from "./notify";

/* ---------------------------------------------------------------------------
 * Server-side order pricing and Razorpay plumbing.
 *
 * RULE: the browser never tells us what to charge. It sends { sku, qty } only;
 * every price, the shipping rule and the grand total are recomputed here from
 * the Google Sheet. Trusting a client-supplied amount is how storefronts end up
 * selling ₹10,000 of cashews for ₹1.
 * ------------------------------------------------------------------------- */

export interface CartInput { sku: string; qty: number }

export interface PricedOrder {
  lines: { sku: string; name: string; qty: number; price: number; lineTotal: number }[];
  qty: number;
  subtotal: number;
  saved: number;
  shipping: number;
  total: number;
  /** Problems that must block checkout (out of stock, unknown SKU, …). */
  problems: string[];
}

const MAX_QTY_PER_LINE = 99;

/** Recompute an order from authoritative sheet data. */
export async function priceOrder(items: CartInput[]): Promise<PricedOrder> {
  const products = await getProducts();
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const problems: string[] = [];
  const lines: PricedOrder["lines"] = [];

  for (const item of items ?? []) {
    const qtyRaw = Number(item?.qty);
    const p = bySku.get(String(item?.sku ?? ""));

    if (!p) { problems.push(`Product ${item?.sku ?? "?"} is no longer available.`); continue; }
    if (!Number.isFinite(qtyRaw) || qtyRaw < 1) { problems.push(`Invalid quantity for ${p.name}.`); continue; }

    const qty = Math.min(Math.floor(qtyRaw), p.stock, MAX_QTY_PER_LINE);
    if (p.stock <= 0) { problems.push(`${p.name} is out of stock.`); continue; }
    if (qty < Math.floor(qtyRaw)) problems.push(`Only ${p.stock} of ${p.name} left; quantity reduced.`);

    lines.push({ sku: p.sku, name: p.name, qty, price: p.price, lineTotal: p.price * qty });
  }

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const saved = lines.reduce((n, l) => {
    const p = bySku.get(l.sku);
    return n + (p?.mrp ? (p.mrp - p.price) * l.qty : 0);
  }, 0);
  const shipping = subtotal === 0 || subtotal >= SITE.freeShippingOver ? 0 : SITE.shippingFlat;

  return {
    lines,
    qty: lines.reduce((n, l) => n + l.qty, 0),
    subtotal, saved, shipping,
    total: subtotal + shipping,
    problems
  };
}

/* ---------------------------- Razorpay ---------------------------------- */

/* Read at call time, not module load. Env vars captured into a module-level
   const are frozen for the whole lifetime of a warm serverless instance, so a
   variable added in the host dashboard appears not to work until something
   forces a cold start — an afternoon lost to a value that was correct all along.

   NEXT_PUBLIC_RAZORPAY_KEY_ID is accepted as a fallback purely because
   Razorpay's own integration guide tells people to name it that. The key id is
   public by design (it ships to the browser to open the modal), so honouring
   both spellings costs nothing. There is deliberately NO fallback for the
   secret: a NEXT_PUBLIC_ secret would be published to every visitor. */
/* Dashboard env fields swallow a trailing newline or a pair of wrapping quotes
   without complaint, and either one makes Razorpay answer 401 — identical to a
   genuinely wrong key, with nothing on screen to tell them apart. Hours have
   been lost to a value that was right except for one invisible character. */
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

const keyId = () =>
  clean(process.env.RAZORPAY_KEY_ID) || clean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
const keySecret = () => clean(process.env.RAZORPAY_KEY_SECRET);

let warned = false;

/**
 * Online payment is offered only when both keys are present.
 *
 * When they aren't, checkout silently degrades to Cash on Delivery — right for
 * the customer, but indistinguishable from "I configured it wrong" for whoever
 * is running the shop. So say which half is missing, once, in the log.
 */
export const razorpayReady = () => {
  const id = keyId();
  const secret = keySecret();
  const ready = Boolean(id && secret);

  if (!ready && !warned) {
    warned = true;
    const missing = [!id && "RAZORPAY_KEY_ID", !secret && "RAZORPAY_KEY_SECRET"].filter(Boolean);
    console.warn(
      `[razorpay] Online payment is OFF — checkout will show Cash on Delivery only. ` +
        `Missing: ${missing.join(" and ")}. ` +
        `Set them in your host's environment variables, then redeploy (env changes ` +
        `do not reach a running deploy). See docs/ORDER-NOTIFICATIONS.md.`
    );
  }
  return ready;
};

export function publicKeyId() {
  return keyId();
}

/** Razorpay rejects anything under ₹1. Guard here so the failure is ours and
    legible, rather than a 400 from their API with a customer watching. */
export const RAZORPAY_MIN_PAISE = 100;

/** Carries the upstream HTTP status so the route can tell "your keys are wrong"
    (401) apart from "Razorpay is having a bad day" (5xx). Those need different
    reactions: one is a five-minute fix, the other is wait and retry. */
export class RazorpayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RazorpayError";
    this.status = status;
  }
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string, notes: Record<string, string>) {
  if (!razorpayReady()) throw new RazorpayError("Razorpay keys are not configured", 503);

  const paise = Math.round(amountInRupees * 100);
  if (!Number.isFinite(paise) || paise < RAZORPAY_MIN_PAISE) {
    throw new RazorpayError(`Order total must be at least ₹${RAZORPAY_MIN_PAISE / 100}`, 400);
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId()}:${keySecret()}`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: paise,   // paise, integer
      currency: "INR",
      receipt,
      notes
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const detail = await res.text();
    /* 401 means the key id and secret don't match a Razorpay account — almost
       always a typo, a test key against live mode, or a variable that never
       made it into the host's environment. Worth naming explicitly; it is the
       single most common integration failure. */
    if (res.status === 401) {
      /* "Authentication failed" is all Razorpay says, and it means any of:
         the key was regenerated and this one is stale, the id and secret come
         from different pairs, or a test key is being used against live mode.
         So print a fingerprint that separates them at a glance.

         The key id is safe to log in full — it already ships to every
         customer's browser to open the modal. The secret is NEVER logged; only
         its length, which is the one property that reveals a stray character
         without revealing the value. A Razorpay secret is 24 characters. */
      const id = keyId();
      const secretLen = keySecret().length;
      console.error(
        `[razorpay] 401 Authentication failed.\n` +
          `  key id in use : ${id || "(empty)"}\n` +
          `  key id mode   : ${id.startsWith("rzp_live_") ? "LIVE" : id.startsWith("rzp_test_") ? "TEST" : "UNRECOGNISED"}\n` +
          `  secret length : ${secretLen}${secretLen && secretLen !== 24 ? "  <-- expected 24; check for a stray space or quote" : ""}\n` +
          `  Compare that key id against Razorpay Dashboard > Account & Settings > API Keys. ` +
          `If it does not match, the key was regenerated and the new pair must be set in your host's ` +
          `environment (BOTH id and secret — they only work as a matched pair), then redeploy.`
      );
      throw new RazorpayError("Payment gateway rejected our credentials.", 401);
    }
    throw new RazorpayError(
      `Razorpay order creation failed (${res.status}): ${detail.slice(0, 300)}`,
      res.status >= 500 ? 502 : 500
    );
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

/**
 * Confirms a payment really came from Razorpay.
 * Razorpay signs `order_id|payment_id` with the key secret; recompute it and
 * compare in constant time. Without this, anyone can POST a fake success.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const secret = keySecret();
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------- order bookkeeping ----------------------------- */

/**
 * Human-readable but collision-resistant: a base36 timestamp for rough
 * ordering plus 7 crypto-random characters (32^7 ≈ 34 billion), so even a
 * burst of orders inside the same millisecond stays unique.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — misread over the phone
export function orderRef() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const bytes = randomBytes(7);
  let rand = "";
  for (let i = 0; i < 7; i++) rand += ALPHABET[bytes[i] % ALPHABET.length];
  return `HOC-${stamp}${rand}`;
}

/**
 * Records and announces a placed order.
 *
 * This used to POST to a single optional webhook and, when that was unset, do
 * nothing but write a warning — which is how the shop ended up taking Cash on
 * Delivery orders whose only trace was a rolling server log. It now fans out to
 * every configured channel (sheet + email + Telegram); see lib/notify.
 *
 * Still never throws. The customer has already committed by the time we reach
 * here, so a notification problem is ours to fix, not theirs to be shown.
 */
export async function recordOrder(payload: OrderRecord) {
  try {
    await notifyOrder(payload);
  } catch (err) {
    // notifyOrder is already defensive; this is the belt to its braces.
    console.error("[order] notification fan-out threw unexpectedly:", err, JSON.stringify(payload));
  }
}
