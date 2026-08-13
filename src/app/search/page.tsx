import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, byFamily, slugify } from "@/lib/sheet";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductCard";
import { SITE } from "@/lib/site";

/* ---------------------------------------------------------------------------
 * /search
 *
 * The header search is a client-side overlay, which is right for a shopper but
 * invisible to everything else: a shared search link, a browser that blocked the
 * script, and — most usefully — Google's SearchAction, which needs a real URL
 * that returns real results before it will consider a sitelinks searchbox.
 *
 * This page is deliberately `noindex, follow`: search-result URLs are infinite
 * and near-duplicate, so they must never enter the index, but the links out of
 * them to product pages are worth following. robots.txt blocks the path as well,
 * for crawlers that would otherwise enumerate queries.
 * ------------------------------------------------------------------------- */

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Search",
  description: "Search dry fruits, nuts, seeds and spices at House of Charly.",
  robots: { index: false, follow: true }
};

function scoreOf(haystack: string, terms: string[]) {
  const s = haystack.toLowerCase();
  return terms.reduce((n, t) => n + (s.includes(t) ? 1 : 0), 0);
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const { products, categories } = await getCatalog();
  const live = products.filter((p) => p.sellable);

  /* Every term must appear somewhere in the product's text; results are then
     ordered by how many fields matched, so a name hit outranks a description
     mention of the same word. */
  const hits = terms.length
    ? byFamily(
        live.filter((p) => {
          const text = `${p.name} ${p.category} ${p.sku} ${p.shortDescription} ${p.longDescription}`.toLowerCase();
          return terms.every((t) => text.includes(t));
        })
      ).sort(
        (a, b) =>
          scoreOf(b.name, terms) - scoreOf(a.name, terms) ||
          Number(b.images.length > 0) - Number(a.images.length > 0) ||
          a.name.localeCompare(b.name)
      )
    : [];

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: query ? `Search: ${query}` : "Search" }]}
      />

      <section className="pb-16">
        <div className="wrap">
          <h1 className="text-[clamp(30px,4.2vw,48px)]">
            {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search"}
          </h1>

          <form action="/search" method="get" className="mt-6 flex max-w-[520px] gap-2.5">
            <label htmlFor="q" className="sr-only">
              Search products
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Cashews, walnuts, haldi…"
              className="w-full rounded-sm border border-line bg-white px-4 py-3 text-[15px]"
            />
            <button type="submit" className="btn-amber whitespace-nowrap">
              Search
            </button>
          </form>

          {query && (
            <p className="mt-5 text-[14px] text-muted">
              {hits.length} product{hits.length === 1 ? "" : "s"} matched.
            </p>
          )}

          {hits.length > 0 && (
            <div className="mt-9">
              <ProductGrid items={hits} />
            </div>
          )}

          {query && hits.length === 0 && (
            <div className="mt-8 max-w-[62ch]">
              <p className="text-muted">
                Nothing matched that. Try a shorter word — &ldquo;kaju&rdquo; rather than a full
                product name — or browse the categories below.
              </p>
            </div>
          )}

          {/* A dead end is a wasted visit. Always offer somewhere to go next. */}
          <div className="mt-10 border-t border-line pt-6 text-[14px] text-muted">
            Browse instead:{" "}
            {categories.map((c) => (
              <span key={c}>
                <Link href={`/c/${slugify(c)}`} className="border-b border-amber pb-0.5 text-ink">
                  {c}
                </Link>
                {" · "}
              </span>
            ))}
            <Link href="/shop" className="border-b border-amber pb-0.5 text-ink">
              all {live.length} products
            </Link>
            {" · "}
            <Link href="/contact" className="border-b border-amber pb-0.5 text-ink">
              ask us on {SITE.phone}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
