"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { SearchOverlay } from "./SearchOverlay";
import { Logo } from "./Logo";
import type { Product } from "@/lib/types";

const NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/c/dry-fruit", label: "Dry Fruits" },
  { href: "/c/spices", label: "Spices" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" }
];

export function Header({ products }: { products: Product[] }) {
  const { qty, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  /* The drawer no longer opens on every add, so the badge is the primary
     feedback — give it a short pulse whenever the count changes. */
  const [pulse, setPulse] = useState(false);
  const prevQty = useRef(qty);
  useEffect(() => {
    if (qty !== prevQty.current && qty > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 420);
      return () => clearTimeout(t);
    }
    prevQty.current = qty;
  }, [qty]);

  return (
    <>
      <div className="bg-ink px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.09em] text-[#E8DFD2]">
        Free delivery on orders above <b className="font-semibold text-amber-light">₹999</b>
        &nbsp;·&nbsp; Sourced in Jammu &nbsp;·&nbsp; Freshly packed in small batches
      </div>

      <header className="sticky top-0 z-[80] border-b border-line bg-cream/92 backdrop-blur-lg">
        <div className="wrap flex h-[74px] items-center gap-5">
          <button className="grid h-10 w-10 place-items-center lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>

          <Link href="/" className="flex shrink-0 items-center" aria-label="House of Charly — home">
            <Logo tone="dark" height={38} priority />
          </Link>

          <nav className="ml-3 hidden gap-7 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className="border-b border-transparent py-1.5 text-[12px] font-medium uppercase tracking-[0.11em] text-muted hover:border-amber hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button className="grid h-10 w-10 place-items-center hover:bg-cream-2" onClick={() => setSearch(true)} aria-label="Search products">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </button>
            <button className="relative grid h-10 w-10 place-items-center hover:bg-cream-2" onClick={() => setOpen(true)} aria-label={`Open cart, ${qty} items`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 7h12l-1.2 12.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8z" /><path d="M9 7V5.5a3 3 0 016 0V7" /></svg>
              {qty > 0 && (
                <span className={`absolute right-1 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-amber px-1 text-[10px] font-bold leading-none text-white transition-transform duration-200 ${pulse ? "scale-[1.45]" : "scale-100"}`}>
                  {qty}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <nav aria-hidden={!menu}
        className={`fixed inset-0 z-[110] overflow-auto bg-ink p-6 text-white transition-transform duration-300 ${menu ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo tone="light" height={34} />
          <button onClick={() => setMenu(false)} aria-label="Close menu" className="p-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <div className="mt-5">
          {[...NAV, { href: "/faq", label: "FAQ" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(false)}
              className="block border-b border-white/10 py-3 font-display text-[30px]">{n.label}</Link>
          ))}
        </div>
        <Link href="/shop" onClick={() => setMenu(false)} className="btn-light mt-8 w-full">Shop the Collection</Link>
      </nav>

      {search && <SearchOverlay products={products} onClose={() => setSearch(false)} />}
    </>
  );
}
