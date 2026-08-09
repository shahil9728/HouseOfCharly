"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { track } from "@/lib/analytics";
import { SITE } from "@/lib/site";
import type { OrderCustomer } from "@/lib/whatsapp";
import { ProductImage } from "./ProductImage";

const EMPTY: OrderCustomer = { name: "", phone: "", address: "", city: "", pin: "", note: "" };

const RULES: [keyof OrderCustomer, (v: string) => boolean, string][] = [
  ["name", (v) => v.trim().length >= 2, "Please enter your name."],
  ["phone", (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")), "Enter a valid 10-digit Indian mobile number."],
  ["address", (v) => v.trim().length >= 8, "Please enter your delivery address."],
  ["city", (v) => v.trim().length >= 2, "Required."],
  ["pin", (v) => /^\d{6}$/.test(v.replace(/\D/g, "")), "6 digits."]
];

type Method = "razorpay" | "cod";

/** Razorpay's checkout script, loaded only when someone actually pays online. */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({ onlineEnabled }: { onlineEnabled: boolean }) {
  const { lines, qty, subtotal, saved, shipping, total } = useCart();
  const router = useRouter();
  const [c, setC] = useState<OrderCustomer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderCustomer, string>>>({});
  const [method, setMethod] = useState<Method>(onlineEnabled ? "razorpay" : "cod");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const set = (k: keyof OrderCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((p) => ({ ...p, [k]: e.target.value }));

  if (!lines.length) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-[26px]">Your cart is empty</h1>
        <p className="mt-1 text-muted">Add something you love, then come back here.</p>
        <Link href="/shop" className="btn-primary mt-5">Browse Products</Link>
      </div>
    );
  }

  const validate = () => {
    const next: Partial<Record<keyof OrderCustomer, string>> = {};
    RULES.forEach(([k, test, msg]) => { if (!test(String(c[k] ?? ""))) next[k] = msg; });
    setErrors(next);
    if (Object.keys(next).length) {
      const first = document.querySelector<HTMLElement>(`[data-field="${Object.keys(next)[0]}"]`);
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus();
      return false;
    }
    return true;
  };

  // the server re-prices from the sheet; we only send what was chosen
  const payload = () => ({
    items: lines.map((l) => ({ sku: l.product.sku, qty: l.qty })),
    customer: { ...c, phone: c.phone.replace(/\D/g, "") }
  });

  const placeCod = async () => {
    const res = await fetch("/api/checkout/cod", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload())
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Could not place the order.");
    track("purchase", { transaction_id: data.ref, value: data.total, currency: "INR", payment_type: "cod" });
    router.push(`/order/success?ref=${encodeURIComponent(data.ref)}&method=cod`);
  };

  const payOnline = async () => {
    const created = await fetch("/api/checkout/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload())
    });
    const order = await created.json();
    if (!created.ok) throw new Error(order?.error ?? "Could not start payment.");

    if (!(await loadRazorpay())) throw new Error("Could not reach the payment provider. Check your connection.");

    const RazorpayCtor = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay;
    const rzp = new RazorpayCtor({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: SITE.name,
      description: `${qty} item${qty > 1 ? "s" : ""} · ${order.ref}`,
      image: "/icon.png",
      prefill: { name: c.name, contact: c.phone.replace(/\D/g, "") },
      notes: { address: `${c.address}, ${c.city} ${c.pin}` },
      theme: { color: "#B4741F" },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setFailure("Payment was cancelled. Your cart is safe — you can try again.");
        }
      },
      handler: async (r: Record<string, string>) => {
        try {
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...r, ref: order.ref, ...payload() })
          });
          const out = await v.json();
          if (!v.ok || !out.ok) throw new Error(out?.error ?? "Payment could not be verified.");
          track("purchase", {
            transaction_id: order.ref, value: order.total, currency: "INR", payment_type: "razorpay"
          });
          router.push(`/order/success?ref=${encodeURIComponent(order.ref)}&method=razorpay`);
        } catch (err) {
          setBusy(false);
          setFailure(
            err instanceof Error
              ? `${err.message} If money was deducted, contact us on ${SITE.phone} with your payment ID.`
              : "Payment verification failed."
          );
        }
      }
    });
    rzp.open();
  };

  const submit = async () => {
    setFailure(null);
    if (!validate() || busy) return;
    setBusy(true);
    track("begin_checkout", { value: total, currency: "INR", payment_type: method });
    try {
      if (method === "cod") { await placeCod(); }
      else { await payOnline(); return; }   // Razorpay clears `busy` via its own callbacks
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <section className="pb-16 pt-2">
      <div className="wrap">
        <h1 className="text-[clamp(34px,4.4vw,50px)]">Checkout</h1>
        <p className="mt-2 max-w-[56ch] text-muted">
          Enter your delivery details and choose how you would like to pay. No account needed.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
          <div>
            <h2 className="mb-4 font-display text-2xl">Your details</h2>
            <Field id="name" label="Full name" required error={errors.name}>
              <input data-field="name" className="field-input" autoComplete="name"
                placeholder="e.g. Rohit Sharma" value={c.name} onChange={set("name")} />
            </Field>
            <Field id="phone" label="Contact number" required error={errors.phone}
              hint="We will confirm your order on this number.">
              <input data-field="phone" className="field-input" type="tel" inputMode="numeric"
                autoComplete="tel" placeholder="10-digit mobile number" value={c.phone} onChange={set("phone")} />
            </Field>
            <Field id="address" label="Delivery address" required error={errors.address}>
              <textarea data-field="address" className="field-input" rows={3} autoComplete="street-address"
                placeholder="House / flat, street, landmark" value={c.address} onChange={set("address")} />
            </Field>
            <div className="grid grid-cols-[1fr_140px] gap-3.5">
              <Field id="city" label="City" required error={errors.city}>
                <input data-field="city" className="field-input" autoComplete="address-level2"
                  placeholder="City" value={c.city} onChange={set("city")} />
              </Field>
              <Field id="pin" label="PIN code" required error={errors.pin}>
                <input data-field="pin" className="field-input" inputMode="numeric" autoComplete="postal-code"
                  placeholder="000000" value={c.pin} onChange={set("pin")} />
              </Field>
            </div>
            <Field id="note" label="Order notes (optional)">
              <textarea data-field="note" className="field-input" rows={2}
                placeholder="Gift wrap, delivery timing, bulk quantity…" value={c.note} onChange={set("note")} />
            </Field>

            <h2 className="mb-4 mt-9 font-display text-2xl">Payment</h2>
            <div className="space-y-3">
              {onlineEnabled && (
                <PayOption
                  checked={method === "razorpay"} onSelect={() => setMethod("razorpay")}
                  title="Pay online" tag="Recommended"
                  desc="UPI, cards, net banking or wallets. Secured by Razorpay."
                />
              )}
              <PayOption
                checked={method === "cod"} onSelect={() => setMethod("cod")}
                title="Cash on Delivery"
                desc="Pay the delivery partner when your order arrives."
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="border border-line bg-white p-5">
              <h2 className="mb-3.5 font-display text-[22px]">Order summary</h2>
              {lines.map(({ product: p, qty: n }) => (
                <div key={p.sku} className="flex gap-3 border-b border-line py-3">
                  <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden border border-line bg-cream">
                    <ProductImage src={p.images[0]} alt={p.name} name={p.name} sub={p.weight} sizes="52px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[16px] leading-tight">{p.name}</span>
                    <span className="block text-[11.5px] text-faint">Qty {n} × {inr(p.price)}</span>
                  </span>
                  <span className="text-[14px] font-semibold">{inr(p.price * n)}</span>
                </div>
              ))}
              <div className="mt-3.5">
                <Row label="Subtotal" value={inr(subtotal)} />
                {saved > 0 && <Row label="You save" value={`−${inr(saved)}`} className="text-leaf" />}
                <Row label="Delivery" value={shipping === 0 ? "FREE" : inr(shipping)} />
                <div className="mt-2 flex justify-between border-t border-line pt-3 text-[19px] font-semibold">
                  <span>Total payable</span><span>{inr(total)}</span>
                </div>
              </div>

              {failure && (
                <p role="alert" className="mt-4 rounded-sm border-l-[3px] border-brick bg-[#FDF7F6] px-3.5 py-3 text-[13px] text-brick">
                  {failure}
                </p>
              )}

              <button onClick={submit} disabled={busy}
                className={`${method === "cod" ? "btn-primary" : "btn-amber"} mt-4 w-full py-4`}>
                {busy
                  ? "Please wait…"
                  : method === "cod"
                    ? `Place Order · ${inr(total)}`
                    : `Pay ${inr(total)}`}
              </button>

              <p className="mt-2.5 text-center text-[11.5px] text-faint">
                {method === "cod"
                  ? "Pay in cash when your order is delivered."
                  : "Payments are processed securely by Razorpay. We never see your card details."}
              </p>
            </div>
            <Link href="/shop" className="btn-ghost mt-3 w-full">Continue Shopping</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PayOption({ checked, onSelect, title, desc, tag }: {
  checked: boolean; onSelect: () => void; title: string; desc: string; tag?: string;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-[3px] border p-4 transition
      ${checked ? "border-ink bg-cream-2" : "border-line bg-white hover:border-[#D6C8B4]"}`}>
      <input type="radio" name="payment" checked={checked} onChange={onSelect}
        className="mt-1 h-4 w-4 accent-amber" />
      <span>
        <span className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {tag && <span className="pill bg-leaf-soft text-leaf">{tag}</span>}
        </span>
        <span className="mt-0.5 block text-[13px] text-muted">{desc}</span>
      </span>
    </label>
  );
}

function Field({ id, label, required, error, hint, children }: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-brick">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[11.5px] text-brick">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-[11.5px] text-faint">{hint}</p>}
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`flex justify-between py-1 text-[14px] text-muted ${className}`}><span>{label}</span><span>{value}</span></div>;
}
