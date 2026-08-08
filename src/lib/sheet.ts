import "server-only";
import type { Catalog, DataIssue, Product } from "./types";

/* ---------------------------------------------------------------------------
 * Google Sheets is the product database.
 *
 * Tab 1 ("inventory") is the raw Vyapar accounting export — DO NOT restructure
 * it, the owner re-imports it into their billing software. We read it as-is.
 *
 * Tab 2 ("Catalog") is additive and owned by the website: descriptions, image
 * URLs, SEO fields, flags. Joined onto tab 1 by item_code.
 *
 * Everything is fetched at build/revalidate time on the server, so no Google
 * request ever happens in a visitor's browser.
 * ------------------------------------------------------------------------- */

const SHEET_ID = process.env.SHEET_ID ?? "";
const GID_INVENTORY = process.env.SHEET_GID_INVENTORY ?? "0";
const GID_CATALOG = process.env.SHEET_GID_CATALOG ?? "";
const REVALIDATE = Number(process.env.REVALIDATE_SECONDS ?? 300);

const csvUrl = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

/* --- RFC4180 CSV parser: handles quoted fields with commas and newlines --- */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toObjects(rows: string[][]): Record<string, string>[] {
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.replace(/^﻿/, "").trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    head.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

export const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/\+/g, "plus ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Groups pack sizes. Strips the weight but keeps the "P" powder marker. */
export const familyKey = (name: string) =>
  name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(kg|g)\b/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const num = (v: string | undefined): number | null => {
  const t = (v ?? "").trim();
  if (!t) return null;
  const n = Number(t.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const bool = (v: string | undefined) => /^(true|yes|1|y)$/i.test((v ?? "").trim());

async function fetchTab(gid: string): Promise<Record<string, string>[]> {
  const res = await fetch(csvUrl(gid), {
    next: { revalidate: REVALIDATE },
    headers: { "User-Agent": "HouseOfCharly/1.0" }
  });
  if (!res.ok) throw new Error(`Sheet tab ${gid} responded ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    // Google served an HTML login/error page instead of CSV
    throw new Error(`Sheet tab ${gid} is not publicly readable`);
  }
  return toObjects(parseCsv(text));
}

export async function getCatalog(): Promise<Catalog> {
  const issues: DataIssue[] = [];

  if (!SHEET_ID) {
    return { products: [], categories: [], issues: [
      { sku: "-", name: "-", issue: "SHEET_ID is not set", severity: "error" }
    ], degraded: true, fetchedAt: new Date().toISOString() };
  }

  let inventory: Record<string, string>[] = [];
  let catalogRows: Record<string, string>[] = [];

  try {
    inventory = await fetchTab(GID_INVENTORY);
  } catch (err) {
    // Never crash the storefront because a spreadsheet is unreachable.
    console.error("[sheet] inventory fetch failed:", err);
    return { products: [], categories: [], issues: [
      { sku: "-", name: "-", issue: String(err), severity: "error" }
    ], degraded: true, fetchedAt: new Date().toISOString() };
  }

  if (GID_CATALOG) {
    try {
      catalogRows = await fetchTab(GID_CATALOG);
    } catch (err) {
      // Catalog tab is optional — degrade to inventory-only rather than fail.
      console.warn("[sheet] catalog tab unavailable, continuing without it:", err);
      issues.push({ sku: "-", name: "-", severity: "warning",
        issue: "Catalog tab could not be read; descriptions and images are unavailable." });
    }
  }

  const byCode = new Map<string, Record<string, string>>();
  catalogRows.forEach((r) => {
    const code = (r.item_code ?? "").trim();
    if (code) byCode.set(code, r);
  });

  const seen = new Map<string, string>();
  const products: Product[] = [];

  inventory.forEach((r, i) => {
    const name = (r["Item name*"] ?? r["Item name"] ?? "").trim();
    if (!name) return;

    let sku = (r["Item code"] ?? "").trim();
    const category = (r["Category"] ?? "").trim() || "Uncategorised";
    const price = num(r["Sale price"]);
    const discount = num(r["Sale Discount"]) ?? 0;
    const stock = num(r["Opening stock quantity"]) ?? 0;
    const lowStockAt = num(r["Minimum stock quantity"]) ?? 3;
    const unit = ((r["Base Unit (x)"] ?? "").trim() || "Pack").replace(/\b\w/g, (c) => c.toUpperCase());

    if (!sku) {
      issues.push({ sku: "(blank)", name, severity: "error",
        issue: "Missing Item code — no stable product URL can be built." });
      sku = `NOCODE-${i}`;
    }
    if (seen.has(sku)) {
      issues.push({ sku, name, severity: "error",
        issue: `Duplicate Item code, already used by "${seen.get(sku)}".` });
    } else {
      seen.set(sku, name);
    }
    if (price === null) {
      issues.push({ sku, name, severity: "error",
        issue: "No Sale price — product is hidden from the storefront." });
    }

    const c = byCode.get(sku) ?? {};
    const images = [c.image_1, c.image_2, c.image_3, c.image_4]
      .map((u) => (u ?? "").trim())
      .filter((u) => /^https?:\/\//.test(u));

    const weightMatch = name.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
    const weight = weightMatch ? `${weightMatch[1]} ${weightMatch[2].toLowerCase()}` : null;
    const mrp = price !== null && discount > 0 ? Math.round(price + discount) : null;

    products.push({
      sku,
      name: (c.display_name ?? "").trim() || name,
      slug: (c.slug ?? "").trim() || slugify(name),
      category,
      family: familyKey(name),
      unit,
      weight,
      price: price === null ? 0 : Math.round(price),
      mrp,
      discountPct: mrp ? Math.round((discount / (price! + discount)) * 100) : 0,
      stock: Math.max(0, Math.round(stock)),
      lowStockAt: Math.max(1, Math.round(lowStockAt)),
      images,
      shortDescription: (c.short_description ?? "").trim(),
      longDescription: (c.long_description ?? "").trim(),
      seoTitle: (c.seo_title ?? "").trim() || `${name} — Buy Online | House of Charly`,
      seoDescription: (c.seo_description ?? "").trim() || (c.short_description ?? "").trim(),
      featured: bool(c.featured),
      bestseller: bool(c.bestseller),
      sortOrder: num(c.sort_order) ?? (i + 1) * 10,
      sellable: price !== null && !/^(false|no|0)$/i.test((c.publish ?? "true").trim())
    });
  });

  /* Two rows can produce the same slug (e.g. two different "Almonds 1kg" SKUs).
     Duplicate slugs would collide in generateStaticParams and break the build,
     so the later one gets its SKU appended and the clash is reported. */
  const slugSeen = new Map<string, string>();
  products.forEach((p) => {
    const owner = slugSeen.get(p.slug);
    if (owner && owner !== p.sku) {
      const unique = `${p.slug}-${p.sku.toLowerCase()}`;
      issues.push({ sku: p.sku, name: p.name, severity: "error",
        issue: `Product name collides with another row; URL changed to /p/${unique}. Rename one of them in the sheet.` });
      p.slug = unique;
    }
    slugSeen.set(p.slug, p.sku);
  });

  // Price sanity: a larger pack should never cost less than a smaller one.
  const grams = (w: string | null) => {
    if (!w) return 0;
    const [n, u] = w.split(" ");
    return u === "kg" ? Number(n) * 1000 : Number(n);
  };
  const fams = new Map<string, Product[]>();
  products.forEach((p) => {
    if (!p.weight || !p.sellable) return;
    fams.set(p.family, [...(fams.get(p.family) ?? []), p]);
  });
  fams.forEach((group) => {
    const sorted = group.slice().sort((a, b) => grams(a.weight) - grams(b.weight));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].price < sorted[i - 1].price) {
        issues.push({ sku: sorted[i].sku, name: sorted[i].name, severity: "warning",
          issue: `Priced ${sorted[i].price} but the smaller ${sorted[i - 1].weight} pack is ${sorted[i - 1].price}. Likely a typo.` });
      }
    }
  });

  const live = products.filter((p) => p.sellable);
  const categories = [...new Set(live.map((p) => p.category))].sort();

  return { products, categories, issues, degraded: false, fetchedAt: new Date().toISOString() };
}

/* ---- read helpers used by the routes ---- */
export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products.filter((p) => p.sellable);
}
export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}
export async function getByCategory(categorySlug: string): Promise<Product[]> {
  return (await getProducts()).filter((p) => slugify(p.category) === categorySlug);
}

/** One representative per product family — stops six Kaju sizes filling a grid. */
export function byFamily(list: Product[]): (Product & { variants: number; fromPrice: number })[] {
  const groups = new Map<string, Product[]>();
  list.forEach((p) => groups.set(p.family, [...(groups.get(p.family) ?? []), p]));
  return [...groups.values()].map((g) => {
    const rep = g.slice().sort((a, b) =>
      Number(b.stock > 0) - Number(a.stock > 0) ||
      Number(b.images.length > 0) - Number(a.images.length > 0) ||
      b.discountPct - a.discountPct ||
      a.price - b.price
    )[0];
    return { ...rep, variants: g.length, fromPrice: Math.min(...g.map((x) => x.price)) };
  });
}

/** Alternates categories so a row is never all one kind of thing. */
export function interleave<T extends { category: string }>(list: T[]): T[] {
  const buckets = new Map<string, T[]>();
  list.forEach((p) => buckets.set(p.category, [...(buckets.get(p.category) ?? []), p]));
  const out: T[] = [];
  let added = true;
  while (added) {
    added = false;
    buckets.forEach((b) => { const n = b.shift(); if (n) { out.push(n); added = true; } });
  }
  return out;
}
