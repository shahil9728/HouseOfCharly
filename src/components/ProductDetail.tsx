"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { inr, stockState } from "@/lib/format";
import { SITE } from "@/lib/site";
import { track } from "@/lib/analytics";
import { waLink } from "@/lib/whatsapp";
import { useCart } from "@/context/CartContext";
import { ProductImage } from "./ProductImage";

export function ProductDetail({ product: p, sizes }: { product: Product; sizes: Product[] }) {
  const { add, qtyOf, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const s = stockState(p);
  const inCart = qtyOf(p.sku);

  useEffect(() => {
    setQty(1); setImg(0);
    track("view_item", {
      currency: "INR", value: p.price,
      items: [{ item_id: p.sku, item_name: p.name, item_category: p.category, price: p.price }]
    });
  }, [p.sku, p.price, p.name, p.category]);

  const images = p.images.length ? p.images : [""];
  const bump = (d: number) => setQty((q) => Math.max(1, Math.min(p.stock, q + d)));

  return (
    <>
      <section className="pb-14 pt-2">
        <div className="wrap grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
          {/* gallery */}
          <div>
            <div onClick={() => setZoom((z) => !z)}
              className={`relative aspect-square overflow-hidden border border-line bg-white ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}>
              <div className={`h-full w-full transition-transform duration-300 ${zoom ? "scale-[2]" : "scale-100"}`}>
                <ProductImage src={images[img]} alt={`${p.name} — House of Charly`} name={p.name}
                  sub={p.weight} priority sizes="(max-width:1024px) 100vw, 55vw" />
              </div>
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((src, j) => (
                  <button key={src} onClick={() => setImg(j)} aria-label={`View image ${j + 1}`}
                    className={`relative h-[74px] w-[74px] overflow-hidden border bg-white ${j === img ? "border-ink" : "border-line"}`}>
                    <ProductImage src={src} alt={`${p.name} view ${j + 1}`} name={p.name} sizes="74px" />
                  </button>
                ))}
              </div>
            )}
            {!p.images.length && (
              <p className="mt-3 text-[12px] text-faint">
                Photography for this product is not in the catalogue yet. Add image URLs to the Sheet and they appear here automatically.
              </p>
            )}
          </div>

          {/* buy box */}
          <div>
            <div className="eyebrow">{p.category}</div>
            <h1 className="mt-2 text-[clamp(34px,4.6vw,52px)]">{p.name}</h1>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <span className={`pill ${s.key === "out" ? "bg-[#F7E9E6] text-brick"
                : s.key === "low" ? "bg-amber-soft text-amber" : "bg-leaf-soft text-leaf"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{s.label}
              </span>
              {p.discountPct > 0 && <span className="pill bg-ink text-white">{p.discountPct}% Off</span>}
              <span className="text-[11.5px] text-faint">SKU {p.sku}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-sans text-[30px] font-semibold">{inr(p.price)}</span>
              {p.mrp && (
                <>
                  <span className="text-[16px] text-faint line-through">{inr(p.mrp)}</span>
                  <span className="text-[13px] font-semibold text-brick">You save {inr(p.mrp - p.price)}</span>
                </>
              )}
            </div>
            <div className="mt-1 text-[11.5px] text-faint">
              Inclusive of all taxes · {p.weight ? `${p.weight} pack` : p.unit}
            </div>

            {sizes.length > 1 && (
              <div className="mt-6">
                <div className="mb-2.5 flex items-baseline gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.13em]">Pack size</span>
                  <span className="text-[11.5px] text-faint">{sizes.length} options</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((v) => {
                    const active = v.sku === p.sku;
                    const soldOut = v.stock <= 0;
                    return (
                      <Link key={v.sku} href={`/p/${v.slug}`} aria-current={active ? "page" : undefined}
                        className={`min-w-[92px] rounded-[3px] border px-3.5 py-2 text-center transition
                          ${active ? "border-ink bg-ink text-white"
                                   : "border-line bg-white hover:border-ink"}
                          ${soldOut ? "opacity-45" : ""}`}>
                        <span className="block text-[13px] font-semibold">{v.weight || v.unit}</span>
                        <span className={`block text-[12px] ${active ? "text-white/75" : "text-muted"}`}>
                          {soldOut ? "Sold out" : inr(v.price)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 max-w-[54ch]">
              {(p.longDescription || p.shortDescription || "").split(/\n\n+/).filter(Boolean).map((par, i) => (
                <p key={i} className="mb-3 text-muted">{par}</p>
              ))}
            </div>

            {p.stock > 0 ? (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center border border-line bg-white">
                    <button onClick={() => bump(-1)} aria-label="Decrease quantity"
                      className="h-12 w-11 text-[19px] text-muted hover:bg-cream-2">−</button>
                    <input value={qty} aria-label="Quantity" inputMode="numeric"
                      onChange={(e) => setQty(Math.max(1, Math.min(p.stock, Number(e.target.value) || 1)))}
                      className="h-12 w-[52px] border-x border-line text-center font-semibold outline-none" />
                    <button onClick={() => bump(1)} aria-label="Increase quantity"
                      className="h-12 w-11 text-[19px] text-muted hover:bg-cream-2">+</button>
                  </div>
                  <span className="text-[12.5px] text-faint">{p.stock} available</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="btn-ghost min-w-[170px] flex-1 py-4" onClick={() => add(p.sku, qty)}>
                    {inCart > 0 ? "Add more" : "Add to Cart"}
                  </button>
                  <Link href="/checkout" onClick={() => add(p.sku, qty, { toast: false })}
                    className="btn-primary min-w-[170px] flex-1 py-4">Buy Now</Link>
                </div>

                {inCart > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-[13px] text-leaf">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span><b>{inCart}</b> already in your cart</span>
                    <button onClick={() => setOpen(true)}
                      className="text-muted underline underline-offset-2 hover:text-amber">View cart</button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-sm border-l-[3px] border-amber bg-amber-soft px-4 py-3.5 text-[13.5px] text-[#6B4A15]">
                This product is currently out of stock.{" "}
                <a className="underline" target="_blank" rel="noopener noreferrer"
                  href={waLink(`Hi! Please let me know when ${p.name} is back in stock.`)}>
                  Ask us when it&apos;s back →
                </a>
              </div>
            )}

            <div className="mt-8">
              <Acc title="Product details" open>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13.5px]">
                  <Spec k="Product" v={p.name} />
                  <Spec k="Category" v={p.category} />
                  {p.weight && <Spec k="Net weight" v={p.weight} />}
                  <Spec k="Packaging" v={p.unit} />
                  <Spec k="SKU" v={p.sku} />
                  <Spec k="Origin" v="Sourced in Jammu, India" />
                  <Spec k="Storage" v="Cool, dry place away from direct sunlight" />
                </dl>
              </Acc>
              <Acc title="Shipping">
                <ul className="list-disc pl-5">
                  <li>Free delivery on orders above {inr(SITE.freeShippingOver)}; a flat {inr(SITE.shippingFlat)} applies below that.</li>
                  <li>Orders are packed and dispatched within 1–2 working days.</li>
                  <li>Delivery timelines are confirmed personally before dispatch.</li>
                </ul>
              </Acc>
              <Acc title="Returns & freshness">
                <ul className="list-disc pl-5">
                  <li>Damaged, leaking or incorrect items are replaced in full.</li>
                  <li>Report an issue within 48 hours of delivery with a photo.</li>
                  <li>For food-safety reasons, opened food packs cannot be returned.</li>
                </ul>
              </Acc>
            </div>
          </div>
        </div>
      </section>

      {/* mobile sticky buy bar */}
      {p.stock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[76] flex items-center gap-3 border-t border-line bg-white px-4 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_24px_rgba(20,16,14,.09)] lg:hidden">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[17px]">{p.name}</div>
            <div className="text-[14px] font-semibold">
              {inr(p.price * qty)}{qty > 1 && <span className="ml-1 text-[12px] font-normal text-faint">({qty})</span>}
              {inCart > 0 && <span className="ml-2 text-[11px] font-normal text-leaf">{inCart} in cart</span>}
            </div>
          </div>
          <button className="btn-primary" onClick={() => add(p.sku, qty)}>
            {inCart > 0 ? "Add more" : "Add to Cart"}
          </button>
        </div>
      )}
    </>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (<><dt className="whitespace-nowrap text-faint">{k}</dt><dd className="m-0 font-medium">{v}</dd></>);
}

function Acc({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-line last:border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[12px] font-semibold uppercase tracking-[0.11em] [&::-webkit-details-marker]:hidden">
        {title}<span className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="pb-5 text-[14px] text-muted">{children}</div>
    </details>
  );
}
