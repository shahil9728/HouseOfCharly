"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { CartLine, Product } from "@/lib/types";
import { SITE } from "@/lib/site";
import { track } from "@/lib/analytics";

const KEY = "hoc_cart_v1";

interface Ctx {
  lines: (CartLine & { product: Product })[];
  qty: number;
  subtotal: number;
  saved: number;
  shipping: number;
  total: number;
  open: boolean;
  toast: string | null;
  setOpen: (v: boolean) => void;
  add: (sku: string, qty?: number, silent?: boolean) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
}

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const [raw, setRaw] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setRaw(JSON.parse(s));
    } catch { /* corrupt storage — start empty */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(raw)); } catch { /* quota — ignore */ }
  }, [raw, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const bySku = useMemo(() => new Map(products.map((p) => [p.sku, p])), [products]);

  // Drop lines whose product vanished from the sheet
  const lines = useMemo(
    () => raw.flatMap((l) => {
      const product = bySku.get(l.sku);
      return product ? [{ ...l, product }] : [];
    }),
    [raw, bySku]
  );

  const qty = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0);
  const saved = lines.reduce((n, l) => n + (l.product.mrp ? (l.product.mrp - l.product.price) * l.qty : 0), 0);
  const shipping = subtotal === 0 || subtotal >= SITE.freeShippingOver ? 0 : SITE.shippingFlat;

  const add = useCallback((sku: string, want = 1, silent = false) => {
    const p = bySku.get(sku);
    if (!p) return;
    if (p.stock <= 0) { setToast("Sorry, that product is out of stock."); return; }

    setRaw((prev) => {
      const have = prev.find((l) => l.sku === sku)?.qty ?? 0;
      const final = Math.min(have + want, p.stock);
      const added = final - have;
      if (added <= 0) { setToast(`Only ${p.stock} in stock — that's the maximum.`); return prev; }
      if (have + want > p.stock) setToast(`Only ${p.stock} in stock — cart set to the maximum.`);
      else if (!silent) setToast(`${p.name} added to cart`);

      track("add_to_cart", {
        currency: "INR", value: p.price * added,
        items: [{ item_id: p.sku, item_name: p.name, item_category: p.category, price: p.price, quantity: added }]
      });
      return prev.some((l) => l.sku === sku)
        ? prev.map((l) => (l.sku === sku ? { ...l, qty: final } : l))
        : [...prev, { sku, qty: final }];
    });
    if (!silent) setOpen(true);
  }, [bySku]);

  const setQtyFn = useCallback((sku: string, next: number) => {
    const p = bySku.get(sku);
    if (!p) return;
    const clamped = Math.max(0, Math.min(next, p.stock));
    setRaw((prev) => clamped === 0 ? prev.filter((l) => l.sku !== sku)
      : prev.map((l) => (l.sku === sku ? { ...l, qty: clamped } : l)));
  }, [bySku]);

  const remove = useCallback((sku: string) => {
    const p = bySku.get(sku);
    if (p) track("remove_from_cart", { items: [{ item_id: p.sku, item_name: p.name }] });
    setRaw((prev) => prev.filter((l) => l.sku !== sku));
  }, [bySku]);

  const value: Ctx = {
    lines, qty, subtotal, saved, shipping, total: subtotal + shipping,
    open, toast, setOpen, add, setQty: setQtyFn, remove, clear: () => setRaw([])
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
