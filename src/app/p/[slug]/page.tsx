import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getProduct, getProducts, byFamily, interleave, slugify } from "@/lib/sheet";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductGrid } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: { absolute: p.seoTitle || `${p.name} — Buy Online | House of Charly` },
    description: p.seoDescription || p.shortDescription || `Buy ${p.name} from House of Charly.`,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      type: "website",
      title: { absolute: p.seoTitle || `${p.name} — Buy Online | House of Charly` },
      description: p.seoDescription || p.shortDescription,
      images: p.images.length ? [{ url: p.images[0] }] : undefined
    }
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

  const ld = {
    "@context": "https://schema.org", "@type": "Product",
    name: p.name, sku: p.sku, category: p.category,
    description: p.longDescription || p.shortDescription || undefined,
    image: p.images.length ? p.images : undefined,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer", price: p.price, priceCurrency: "INR",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE.url}/p/${p.slug}`,
      seller: { "@type": "Organization", name: SITE.name }
    }
  };

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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
