"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { track } from "@/lib/analytics";
import { buildOrderMessage, waLink, type OrderCustomer } from "@/lib/whatsapp";
import { ProductImage } from "./ProductImage";

const EMPTY: OrderCustomer = { name: "", phone: "", address: "", city: "", pin: "", note: "" };

const RULES: [keyof OrderCustomer, (v: string) => boolean, string][] = [
  ["name", (v) => v.trim().length >= 2, "Please enter your name."],
  ["phone", (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")), "Enter a valid 10-digit Indian mobile number."],
  ["address", (v) => v.trim().length >= 8, "Please enter your delivery address."],
  ["city", (v) => v.trim().length >= 2, "Required."],
  ["pin", (v) => /^\d{6}$/.test(v.replace(/\D/g, "")), "6 digits."]
];

export function CheckoutForm() {
  const { lines, qty, subtotal, saved, shipping, total } = useCart();
  const [c, setC] = useState<OrderCustomer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderCustomer, string>>>({});

  const set = (k: keyof OrderCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((p) => ({ ...p, [k]: e.target.value }));

  const message = useMemo(
    () => buildOrderMessage(c,
      lines.map((l) => ({ name: l.product.name, sku: l.product.sku, qty: l.qty, price: l.product.price })),
      { subtotal, saved, shipping, total, qty }),
    [c, lines, subtotal, saved, shipping, total, qty]
  );

  if (!lines.length) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-[26px]">Your cart is empty</h1>
        <p className="mt-1 text-muted">Add something you love, then come back here.</p>
        <Link href="/shop" className="btn-primary mt-5">Browse Products</Link>
      </div>
    );
  }

  const submit = () => {
    const next: Partial<Record<keyof OrderCustomer, string>> = {};
    RULES.forEach(([k, test, msg]) => { if (!test(String(c[k] ?? ""))) next[k] = msg; });
    setErrors(next);
    if (Object.keys(next).length) {
      const first = document.querySelector<HTMLElement>(`[data-field="${Object.keys(next)[0]}"]`);
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.focus();
      return;
    }
    track("whatsapp_order", {
      currency: "INR", value: total, num_items: qty,
      items: lines.map((l) => ({ item_id: l.product.sku, item_name: l.product.name, quantity: l.qty, price: l.product.price }))
    });
    window.open(waLink(message), "_blank", "noopener");
  };

  return (
    <section className="pb-16 pt-2">
      <div className="wrap">
        <h1 className="text-[clamp(34px,4.4vw,50px)]">Checkout</h1>
        <p className="mt-2 max-w-[56ch] text-muted">
          Fill in your details and we will open a pre-filled order message for you to send.
          No account needed, no payment online.
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
              <button onClick={submit} className="btn-wa mt-4 w-full py-4">
                Place Order · {inr(total)}
              </button>
              <p className="mt-2.5 text-center text-[11.5px] text-faint">
                No payment now. We confirm stock, delivery and payment with you personally.
              </p>
            </div>
            <Link href="/shop" className="btn-ghost mt-3 w-full">Continue Shopping</Link>
          </aside>
        </div>
      </div>
    </section>
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
