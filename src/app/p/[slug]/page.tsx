import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getProduct, getProducts, byFamily, interleave, slugify } from "@/lib/sheet";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { SITE } from "@/lib/site";
import { JsonLd, productSchema } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  /* A missing product must not be indexable under its old URL — an item code
     changing in the sheet would otherwise leave a soft 404 in the index. */
  if (!p) return { title: "Product not found", robots: { index: false, follow: true } };

  const title = p.seoTitle || `${p.name} — Buy Online at Best Price | House of Charly`;

  /* Descriptions are what actually earn the click. When the sheet has no SEO
     copy, build one from the facts we do hold — price, weight, category — rather
     than emitting a bare "Buy X" that reads like a placeholder. */
  const priceBit = p.price > 0 ? ` Price ₹${p.price}${p.weight ? ` for ${p.weight}` : ""}.` : "";
  const description =
    p.seoDescription ||
    p.shortDescription ||
    `Buy ${p.name} online from House of Charly — sourced from Jammu, freshly packed in small batches.${priceBit} Free delivery over ₹${SITE.freeShippingOver}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      type: "website",
      url: `${SITE.url}/p/${p.slug}`,
      title: { absolute: title },
      description,
      images: p.images.length
        ? [{ url: p.images[0], alt: `${p.name} — ${SITE.name}` }]
        : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: { absolute: title },
      description,
      images: p.images.length ? [p.images[0]] : undefined
    },
    /* Facebook/WhatsApp product annotations. WhatsApp previews are how most of
       this store's links are actually shared, so the price is worth carrying. */
    other:
      p.price > 0
        ? { "product:price:amount": String(p.price), "product:price:currency": "INR" }
        : {}
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const live = products.filter((x) => x.sellable);
  const p = live.find((x) => x.slug === slug);
  if (!p) notFound();

  const sizes = live.filter((x) => x.family === p.family).sort((a, b) => a.price - b.price);
  const related = interleave(
    byFamily(live.filter((x) => x.category === p.category && x.family !== p.family && x.stock > 0))
      .sort((a, b) => Number(b.images.length > 0) - Number(a.images.length > 0) || a.name.localeCompare(b.name))
  ).slice(0, 4);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: p.category, href: `/c/${slugify(p.category)}` },
        { label: p.name }
      ]} />
      <ProductDetail product={p} sizes={sizes} />

      {related.length > 0 && (
        <section className="pb-16 pt-5">
          <div className="wrap">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="eyebrow">You may also like</div>
                <h2 className="mt-2.5 text-[clamp(30px,4vw,46px)]">More from {p.category}</h2>
              </div>
              <Link href={`/c/${slugify(p.category)}`} className="border-b border-amber pb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em]">
                View all →
              </Link>
            </div>
            <ProductGrid items={related} />
          </div>
        </section>
      )}

      {/* Passing the siblings lets the schema declare a ProductGroup when the
          item has several pack sizes, so Google shows one result with a price
          range instead of six near-identical results competing with each other. */}
      <JsonLd data={productSchema(p, sizes)} />
    </>
  );
}
