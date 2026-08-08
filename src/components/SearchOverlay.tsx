"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/format";
import { track } from "@/lib/analytics";
import { ProductImage } from "./ProductImage";

export function SearchOverlay({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  useEffect(() => {
    if (q.length < 3) return;
    const t = setTimeout(() => track("search", { search_term: q }), 600);
    return () => clearTimeout(t);
  }, [q]);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return products
      .filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(t))
      .slice(0, 7);
  }, [q, products]);

  return (
    <div className="fixed inset-0 z-[140] bg-cream">
      <div className="wrap flex items-center gap-3.5 border-b border-line py-4">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-faint">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} type="search"
          aria-label="Search products" placeholder="Search cashews, garam masala, chia seeds, SKU…"
          className="flex-1 border-0 bg-transparent py-1.5 font-display text-[18px] outline-none placeholder:text-faint" />
        <button onClick={onClose} aria-label="Close search" className="p-2 hover:bg-cream-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      </div>
      <div className="wrap max-h-[70vh] overflow-auto">
        {q && !hits.length && (
          <p className="py-7 text-muted">No products match “{q}”. Try “kaju”, “masala” or “seeds”.</p>
        )}
        {hits.map((p) => (
          <Link key={p.sku} href={`/p/${p.slug}`} onClick={onClose}
            className="flex items-center gap-3.5 border-b border-line py-3 hover:bg-cream-2">
            <span className="relative h-[46px] w-[46px] shrink-0 overflow-hidden bg-white">
              <ProductImage src={p.images[0]} alt={p.name} name={p.name} sub={p.weight} sizes="46px" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[19px]">{p.name}</span>
              <span className="block text-[11.5px] text-faint">{p.category} · {p.sku}</span>
            </span>
            <span className="font-semibold">{inr(p.price)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
