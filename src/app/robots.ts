import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* ---------------------------------------------------------------------------
 * robots.txt
 *
 * The store has a small, fixed set of pages worth crawling: home, two
 * categories, and ~75 product families. Everything else either duplicates those
 * (filtered and sorted views) or is private (checkout, order, API) — so these
 * rules keep crawl budget pointed at the pages that can actually rank.
 *
 * /search is disallowed rather than merely noindexed: search-result URLs are
 * infinite, and a crawler that finds one query will happily invent more.
 * ------------------------------------------------------------------------- */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/checkout",
          "/cart",
          "/order/",
          "/api/",
          "/search",
          "/*?filter=",
          "/*?sort=",
          "/*?q="
        ]
      },
      /* Google's image and shopping crawlers must reach the product pages and
         their photography. Naming them stops a future wildcard tightening from
         silently cutting off Google Images and free Shopping listings. */
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Storebot-Google", allow: "/" }
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url
  };
}
