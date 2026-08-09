"use client";
import Link from "next/link";
import { inr, stockState } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { ProductImage } from "./ProductImage";

type Card = Product & { variants?: number; fromPrice?: number; familyName?: string };

export function ProductCard({ p }: { p: Card }) {
  const { add, qtyOf, setQty } = useCart();
  const s = stockState(p);
  const tone = s.key === "out" ? "text-brick" : s.key === "low" ? "text-amber" : "text-leaf";
  const inCart = qtyOf(p.sku);
  // a card standing in for several pack sizes shouldn't advertise just one
  const multi = (p.variants ?? 1) > 1;
  const title = multi ? (p.familyName ?? p.name) : p.name;

  return (
    <article className="group flex flex-col rounded-[3px] border border-line bg-white transition
                        hover:border-[#D6C8B4] hover:shadow-[0_8px_28px_-12px_rgba(20,16,14,0.14)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden bg-cream">
        <ProductImage src={p.images[0]} alt={`${p.name} — House of Charly`} name={p.name} sub={p.weight} />
        <div className="absolute left-2.5 top-2.5 z-[2] flex flex-col items-start gap-1.5">
          {p.discountPct > 0 && <span className="pill bg-ink text-white">{p.discountPct}% Off</span>}
          {s.key === "low" && <span className="pill bg-amber-soft text-amber">{s.label}</span>}
          {s.key === "out" && <span className="pill bg-[#F7E9E6] text-brick">Sold Out</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/p/${p.slug}`}>
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">{p.category}</div>
          <h3 className="mt-1 font-display text-[19px] leading-tight">{title}</h3>
        </Link>

        {p.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-muted">{p.shortDescription}</p>
        ) : (
          <div className="mt-1 text-[11.5px] text-faint">{p.sku}{p.weight ? ` · ${p.weight}` : ""}</div>
        )}

        {multi ? (
          <div className="mt-1.5 text-[11.5px] text-faint">
            {p.variants} pack sizes · from {inr(p.fromPrice ?? p.price)}
          </div>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
          <span className="text-[17px] font-semibold">{inr(p.price)}</span>
          {p.mrp ? (
            <>
              <span className="text-[12.5px] text-faint line-through">{inr(p.mrp)}</span>
              <span className="text-[10.5px] font-bold text-brick">SAVE {inr(p.mrp - p.price)}</span>
            </>
          ) : null}
        </div>

        <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${tone}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />{s.label}
        </div>

        <div className="mt-auto pt-3">
          {p.stock <= 0 ? (
            <button className="btn-ghost w-full" disabled>Out of Stock</button>
          ) : inCart === 0 ? (
            <button className="btn-ghost w-full" onClick={() => add(p.sku, 1)}>Add to Cart</button>
          ) : (
            /* Already in the basket: swap the button for a stepper so the
               shopper can see and adjust the count without leaving the grid.
               No "view cart" link here — the header cart icon is the single
               entry point, and a per-card link just adds noise to the grid. */
            <div className="flex h-[46px] items-center justify-between rounded-[3px] border border-ink bg-ink text-white">
              <button
                onClick={() => setQty(p.sku, inCart - 1)}
                aria-label={inCart === 1 ? `Remove ${p.name} from cart` : `Decrease ${p.name} quantity`}
                className="grid h-full w-11 place-items-center text-[18px] transition hover:bg-white/10">
                {inCart === 1 ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M7 7l1 12.5A1.5 1.5 0 009.5 21h5a1.5 1.5 0 001.5-1.5L17 7" />
                </svg>
                ) : "−"}
              </button>
              <span className="text-[15px] font-semibold tabular-nums" aria-live="polite">
                <span className="sr-only">{p.name} quantity in cart: </span>{inCart}
              </span>
              <button
                onClick={() => add(p.sku, 1)}
                disabled={inCart >= p.stock}
                aria-label={`Increase ${p.name} quantity`}
                className="grid h-full w-11 place-items-center text-[18px] transition hover:bg-white/10 disabled:opacity-35">
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }: { items: Card[] }) {
  if (!items.length) {
    return (
      <div className="py-16 text-center text-muted">
        <h4 className="font-display text-[26px] text-txt">No products match</h4>
        <p className="mt-1">Try clearing a filter or searching for something else.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {items.map((p) => <ProductCard key={p.sku} p={p} />)}
    </div>
  );
}
