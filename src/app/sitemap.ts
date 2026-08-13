import type { MetadataRoute } from "next";
import { getCatalog, slugify } from "@/lib/sheet";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

/* ---------------------------------------------------------------------------
 * Sitemap.
 *
 * The previous version stamped every URL with `new Date()`, so all 140 entries
 * claimed to have changed the moment the sitemap was fetched. Google learns to
 * distrust a lastmod that is always "now" and then ignores it across the whole
 * site — the opposite of the intent. Now:
 *
 *   - product and category URLs carry the catalogue's real fetch timestamp,
 *     because that is genuinely when the data behind them last changed
 *   - static pages carry a fixed content date, bumped by hand when the copy is
 *     edited, so they stop consuming crawl budget every hour
 *   - product entries declare their photography, which is what gets a product
 *     into Google Images — a real traffic source for food
 * ------------------------------------------------------------------------- */

/** Bump this when the wording on the static pages is edited. */
const STATIC_CONTENT_DATE = new Date("2026-08-13T00:00:00.000Z");

const STATICS = [
  { path: "", priority: 1.0, freq: "daily" as const },
  { path: "/shop", priority: 0.9, freq: "daily" as const },
  { path: "/about", priority: 0.6, freq: "monthly" as const },
  { path: "/contact", priority: 0.6, freq: "monthly" as const },
  { path: "/faq", priority: 0.6, freq: "monthly" as const },
  { path: "/shipping", priority: 0.4, freq: "yearly" as const },
  { path: "/returns", priority: 0.4, freq: "yearly" as const },
  { path: "/privacy", priority: 0.3, freq: "yearly" as const },
  { path: "/terms", priority: 0.3, freq: "yearly" as const }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, fetchedAt } = await getCatalog();
  const dataChanged = new Date(fetchedAt);

  const statics: MetadataRoute.Sitemap = STATICS.map(({ path, priority, freq }) => ({
    url: `${SITE.url}${path}`,
    // home and /shop really do change with the catalogue; the policy pages do not
    lastModified: path === "" || path === "/shop" ? dataChanged : STATIC_CONTENT_DATE,
    changeFrequency: freq,
    priority
  }));

  const cats: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE.url}/c/${slugify(c)}`,
    lastModified: dataChanged,
    changeFrequency: "daily",
    priority: 0.8
  }));

  /* In-stock products are prioritised above sold-out ones, but both stay listed:
     removing a temporarily sold-out product discards ranking it has already
     earned, and its page correctly declares OutOfStock. */
  const items: MetadataRoute.Sitemap = products
    .filter((p) => p.sellable)
    .map((p) => ({
      url: `${SITE.url}/p/${p.slug}`,
      lastModified: dataChanged,
      changeFrequency: "daily",
      priority: p.stock > 0 ? 0.7 : 0.4,
      images: p.images.length ? p.images.slice(0, 4) : undefined
    }));

  return [...statics, ...cats, ...items];
}
