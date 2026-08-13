"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { inr } from "@/lib/format";

/** A family representative: one card standing in for all its pack sizes. */
type Card = Product & { variants?: number; fromPrice?: number; familyName?: string };

type Sort = "featured" | "price_asc" | "price_desc" | "discount" | "name";

const SORTS: [Sort, string][] = [
  ["featured", "Featured"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["discount", "Biggest Discount"],
  ["name", "Name A–Z"]
];

export function ShopBrowser({
  products, title, lede, crumbs, lockedCategory, children
}: {
  products: Card[]; title: string; lede?: string; crumbs: Crumb[]; lockedCategory?: string;
  /** Editorial copy rendered below the grid. A grid of cards is thin content on
      its own; the prose is what gives a category page something to rank for. */
  children?: React.ReactNode;
}) {
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const [cats, setCats] = useState<string[]>(lockedCategory ? [lockedCategory] : []);
  const [avail, setAvail] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [maxPrice, setMaxPrice] = useState<number>(1200);

  /* Deliberately NOT useSearchParams(): on a statically generated page that
     opts the entire subtree out of server rendering, so the product grid would
     be missing from the HTML crawlers see. Reading the query after mount keeps
     /shop and the category pages fully server-rendered. */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("filter") === "offers") {
      setAvail(["offer"]);
      setSort("discount");
    }
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const list = useMemo(() => {
    let out = products.slice();
    if (cats.length) out = out.filter((p) => cats.includes(p.category));
    if (avail.includes("in")) out = out.filter((p) => p.stock > 0);
    if (avail.includes("offer")) out = out.filter((p) => p.discountPct > 0);
    // a family qualifies if ANY of its pack sizes is within budget
    out = out.filter((p) => Math.min(p.fromPrice ?? p.price, p.price) <= maxPrice);

    const from = (p: Card) => Math.min(p.fromPrice ?? p.price, p.price);
    const cmp: Record<Sort, (a: Card, b: Card) => number> = {
      featured: (a, b) =>
        Number(b.images.length > 0) - Number(a.images.length > 0) ||
        b.discountPct - a.discountPct || a.name.localeCompare(b.name),
      price_asc: (a, b) => from(a) - from(b),
      price_desc: (a, b) => from(b) - from(a),
      discount: (a, b) => b.discountPct - a.discountPct,
      name: (a, b) => a.name.localeCompare(b.name)
    };
    return out.sort(cmp[sort]);
  }, [products, cats, avail, maxPrice, sort]);

  const count = (c: string) => products.filter((p) => p.category === c).length;
  // total individual pack sizes behind the visible cards
  const packCount = products.reduce((n, p) => n + (p.variants ?? 1), 0);

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <div className="wrap pb-6">
        <h1 className="text-[clamp(34px,4.6vw,54px)]">{title}</h1>
        {lede && <p className="mt-2.5 max-w-[56ch] text-muted">{lede}</p>}
      </div>

      <section className="pb-16">
        <div className="wrap grid items-start gap-8 lg:grid-cols-[238px_1fr] lg:gap-10">
          <aside className="lg:sticky lg:top-24">
            {!lockedCategory && (
              <Group title="Category">
                {categories.map((c) => (
                  <Opt key={c} label={c} count={count(c)} checked={cats.includes(c)}
                    onChange={() => toggle(cats, setCats, c)} />
                ))}
              </Group>
            )}
            <Group title="Availability">
              <Opt label="In stock" count={products.filter((p) => p.stock > 0).length}
                checked={avail.includes("in")} onChange={() => toggle(avail, setAvail, "in")} />
              <Opt label="On offer" count={products.filter((p) => p.discountPct > 0).length}
                checked={avail.includes("offer")} onChange={() => toggle(avail, setAvail, "offer")} />
            </Group>
            <Group title="Max price">
              <input type="range" min={10} max={1200} step={10} value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximum price" className="w-full accent-amber" />
              <div className="mt-1.5 text-[12.5px] text-muted">Up to {inr(maxPrice)}</div>
            </Group>
            <div className="border-t border-line py-4">
              <button className="btn-ghost w-full" onClick={() => {
                setCats(lockedCategory ? [lockedCategory] : []); setAvail([]); setMaxPrice(1200); setSort("featured");
              }}>Clear filters</button>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3.5 border-b border-line pb-4">
              <span className="text-[13px] text-muted">
                <b>{list.length}</b> product{list.length === 1 ? "" : "s"}
                {packCount > list.length && (
                  <span className="text-faint"> · {packCount} pack sizes</span>
                )}
              </span>
              <div className="flex flex-wrap gap-2">
                {avail.map((a) => (
                  <button key={a} onClick={() => toggle(avail, setAvail, a)}
                    className="rounded-full border border-ink bg-ink px-3 py-1.5 text-[11.5px] text-white">
                    {a === "in" ? "In stock" : "On offer"} ×
                  </button>
                ))}
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products"
                className="ml-auto rounded-sm border border-line bg-white px-3 py-2 text-[12.5px]">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <ProductGrid items={list} />
          </div>
        </div>
      </section>

      {children}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]">{title}</h4>
      {children}
    </div>
  );
}

function Opt({ label, count, checked, onChange }: {
  label: string; count: number; checked: boolean; onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13.5px] text-muted hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-amber" />
      {label}
      <span className="ml-auto text-[11px] text-faint">{count}</span>
    </label>
  );
}
