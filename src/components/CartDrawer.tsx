"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { SITE } from "@/lib/site";
import { track } from "@/lib/analytics";
import { ProductImage } from "./ProductImage";
import { useEffect } from "react";

export function CartDrawer() {
  const { lines, qty, subtotal, saved, shipping, total, open, setOpen, setQty, remove } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, setOpen]);

  const away = SITE.freeShippingOver - subtotal;

  return (
    <>
      <div onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[120] bg-ink/50 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-label="Shopping cart" aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[130] flex w-full max-w-[440px] flex-col bg-cream
                    transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <h3 className="font-display text-2xl">
            Your Cart {qty > 0 && <span className="font-sans text-sm text-faint">({qty} item{qty > 1 ? "s" : ""})</span>}
          </h3>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="p-2 hover:bg-cream-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5">
          {!lines.length ? (
            <div className="py-16 text-center text-muted">
              <h4 className="font-display text-[26px] text-txt">Your cart is empty</h4>
              <p className="mt-1">Add a few favourites and they will show up here.</p>
              <Link href="/shop" onClick={() => setOpen(false)} className="btn-primary mt-5">Browse Products</Link>
            </div>
          ) : lines.map(({ product: p, qty: n }) => (
            <div key={p.sku} className="grid grid-cols-[74px_1fr_auto] gap-3.5 border-b border-line py-4">
              <Link href={`/p/${p.slug}`} onClick={() => setOpen(false)}
                className="relative h-[74px] w-[74px] overflow-hidden border border-line bg-white">
                <ProductImage src={p.images[0]} alt={p.name} name={p.name} sub={p.weight} sizes="74px" />
              </Link>
              <div>
                <Link href={`/p/${p.slug}`} onClick={() => setOpen(false)}>
                  <h4 className="font-display text-[17px] leading-tight">{p.name}</h4>
                </Link>
                <div className="text-[12px] text-faint">{p.sku}</div>
                <div className="mt-2 inline-flex items-center border border-line bg-white">
                  <button className="h-[30px] w-[30px] text-muted hover:bg-cream-2"
                    onClick={() => setQty(p.sku, n - 1)} aria-label={`Decrease quantity of ${p.name}`}>−</button>
                  <span className="w-8 text-center text-[13px] font-semibold">{n}</span>
                  <button className="h-[30px] w-[30px] text-muted hover:bg-cream-2 disabled:opacity-30"
                    disabled={n >= p.stock} onClick={() => setQty(p.sku, n + 1)}
                    aria-label={`Increase quantity of ${p.name}`}>+</button>
                </div>
                <button className="mt-2 block text-[11px] text-faint underline hover:text-brick"
                  onClick={() => remove(p.sku)}>Remove</button>
              </div>
              <div className="text-right text-[14px] font-semibold">
                {inr(p.price * n)}
                {n > 1 && <div className="mt-1 text-[11px] font-normal text-faint">{inr(p.price)} each</div>}
              </div>
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line bg-cream-2 px-5 pb-[calc(1.125rem+env(safe-area-inset-bottom))] pt-4">
            {away > 0 && (
              <div className="mb-3.5 rounded-sm border-l-[3px] border-amber bg-amber-soft px-4 py-3 text-[13.5px] text-[#6B4A15]">
                Add <b>{inr(away)}</b> more for free delivery.
              </div>
            )}
            <Row label={`Subtotal (${qty} items)`} value={inr(subtotal)} />
            {saved > 0 && <Row label="You save" value={`−${inr(saved)}`} className="text-leaf" />}
            <Row label="Delivery" value={shipping === 0 ? "FREE" : inr(shipping)} />
            <div className="mt-2 flex justify-between border-t border-line pt-3 text-[19px] font-semibold">
              <span>Total</span><span>{inr(total)}</span>
            </div>
            <Link href="/checkout" onClick={() => { setOpen(false); track("begin_checkout", { value: total, currency: "INR" }); }}
              className="btn-primary mt-3.5 w-full">Buy Now</Link>
            <button className="btn-ghost mt-2 w-full" onClick={() => setOpen(false)}>Continue Shopping</button>
          </div>
        )}
      </aside>
    </>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`flex justify-between py-1 text-[14px] text-muted ${className}`}><span>{label}</span><span>{value}</span></div>;
}
