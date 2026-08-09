import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getProducts } from "./sheet";
import { SITE } from "./site";

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

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

/** Online payment is offered only when both keys are present. */
export const razorpayReady = () => Boolean(KEY_ID && KEY_SECRET);

export function publicKeyId() {
  return KEY_ID;
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string, notes: Record<string, string>) {
  if (!razorpayReady()) throw new Error("Razorpay keys are not configured");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),   // paise, integer
      currency: "INR",
      receipt,
      notes
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; amount: number; currency: string };
}

/**
 * Confirms a payment really came from Razorpay.
 * Razorpay signs `order_id|payment_id` with the key secret; recompute it and
 * compare in constant time. Without this, anyone can POST a fake success.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  if (!KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
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
 * Optional: POST the order somewhere durable (a Google Apps Script bound to the
 * sheet, a Zapier hook, anything that accepts JSON). Never throws — a logging
 * outage must not lose a paid order.
 */
export async function recordOrder(payload: unknown) {
  const url = process.env.ORDERS_WEBHOOK_URL;
  if (!url) {
    console.warn("[order] ORDERS_WEBHOOK_URL not set — order not persisted:", JSON.stringify(payload));
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch (err) {
    console.error("[order] failed to record order:", err);
  }
}
