import type { MetadataRoute } from "next";
import { getCatalog, slugify } from "@/lib/sheet";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalog();
  const now = new Date();

  const statics = ["", "/shop", "/about", "/contact", "/faq", "/shipping", "/returns", "/privacy", "/terms"]
    .map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5
    }));

  const cats = categories.map((c) => ({
    url: `${SITE.url}/c/${slugify(c)}`,
    lastModified: now, changeFrequency: "daily" as const, priority: 0.8
  }));

  const items = products.filter((p) => p.sellable).map((p) => ({
    url: `${SITE.url}/p/${p.slug}`,
    lastModified: now, changeFrequency: "daily" as const, priority: 0.7
  }));

  return [...statics, ...cats, ...items];
}
