import { SITE } from "./site";
import { inr } from "./format";

export interface OrderCustomer {
  name: string; phone: string; address: string; city: string; pin: string; note?: string;
}
export interface OrderLine { name: string; sku: string; qty: number; price: number; }

export function buildOrderMessage(c: OrderCustomer, lines: OrderLine[], totals: {
  subtotal: number; saved: number; shipping: number; total: number; qty: number;
}) {
  const L: string[] = [];
  L.push("*NEW ORDER — House of Charly*", "");
  L.push("*Customer*");
  L.push(`Name: ${c.name || "—"}`);
  L.push(`Phone: +91 ${c.phone || "—"}`);
  L.push(`Address: ${c.address || "—"}`);
  L.push(`City: ${c.city || "—"} — ${c.pin || "—"}`, "");
  L.push("*Items*");
  lines.forEach((l) => L.push(`• ${l.name} (${l.sku}) × ${l.qty} — ${inr(l.price * l.qty)}`));
  L.push("");
  L.push(`Total quantity: ${totals.qty}`);
  L.push(`Subtotal: ${inr(totals.subtotal)}`);
  if (totals.saved > 0) L.push(`Discount applied: −${inr(totals.saved)}`);
  L.push(`Delivery: ${totals.shipping === 0 ? "FREE" : inr(totals.shipping)}`);
  L.push(`*TOTAL: ${inr(totals.total)}*`);
  if (c.note) L.push("", "*Notes*", c.note);
  L.push("", `Order ref: HOC-${Date.now().toString(36).toUpperCase().slice(-6)}`);
  return L.join("\n");
}

export const waLink = (text: string) => `https://wa.me/${SITE.wa}?text=${encodeURIComponent(text)}`;
