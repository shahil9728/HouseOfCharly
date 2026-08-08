import Link from "next/link";
import Image from "next/image";
import { getCatalog, byFamily, interleave, slugify } from "@/lib/sheet";
import { ProductGrid } from "@/components/ProductCard";
import { Hero } from "@/components/Hero";
import { HERO_SLIDES } from "@/lib/slides";
import { TrustStrip } from "@/components/TrustStrip";
import { FaqList, FAQS } from "@/components/Faq";
import { SITE } from "@/lib/site";
import { inr } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const { products, degraded } = await getCatalog();
  const live = products.filter((p) => p.sellable);
  const inStock = live.filter((p) => p.stock > 0);

  // One card per product family, photographed first, alternated across categories,
  // so the grid never shows six sizes of the same item.
  const featured = interleave(
    byFamily(inStock).sort((a, b) =>
      Number(b.images.length > 0) - Number(a.images.length > 0) ||
      b.discountPct - a.discountPct ||
      a.name.localeCompare(b.name))
  ).slice(0, 8);

  const offers = interleave(
    byFamily(inStock.filter((p) => p.discountPct > 0)).sort((a, b) => b.discountPct - a.discountPct)
  ).slice(0, 4);

  const dryN = live.filter((p) => p.category === "Dry Fruit").length;
  const spiceN = live.filter((p) => p.category === "Spices").length;

  if (degraded) {
    return (
      <section className="wrap py-24 text-center">
        <h1 className="text-4xl">We&apos;re just restocking the shelves</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-muted">
          Our catalogue is briefly unavailable. Please try again in a moment, or call us on {SITE.phone}.
        </p>
      </section>
    );
  }

  return (
    <>
      <Hero slides={HERO_SLIDES} />
      <TrustStrip />

      <Section eyebrow="Browse" title="Shop by category" more={{ href: "/shop", label: "View all" }}>
        <div className="grid gap-5 md:grid-cols-2">
          <CategoryTile href="/c/dry-fruit" img={HERO_SLIDES[1].img}
            title="Dry Fruits & Nuts" sub={`${dryN} products · Cashews, walnuts, seeds`} />
          <CategoryTile href="/c/spices" img={HERO_SLIDES[2].img}
            title="Spices & Masalas" sub={`${spiceN} products · Whole, ground & blends`} />
        </div>
      </Section>

      <Section eyebrow="Best Sellers" title="Our signature range"
        lede="The products our customers come back for." more={{ href: "/shop", label: "All products" }} tight>
        <ProductGrid items={featured} />
      </Section>

      {offers.length > 0 && (
        <Section eyebrow="Current Offers" title="On sale this week"
          more={{ href: "/shop?filter=offers", label: "All offers" }} tight>
          <ProductGrid items={offers} />
        </Section>
      )}

      <section className="bg-ink text-white">
        <div className="grid items-stretch md:grid-cols-2">
          <div className="relative min-h-[320px] md:min-h-[440px]">
            <Image src={HERO_SLIDES[2].img} alt="House of Charly spices" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="px-6 py-12 md:px-14 md:py-16">
            <div className="eyebrow">Our Story</div>
            <h2 className="mt-3.5 text-[clamp(30px,3.6vw,44px)] text-white">
              Every great home deserves food it can trust.
            </h2>
            <p className="mt-5 text-[16px] text-[#C9BEB1]">
              House of Charly began with one simple mission — bring authentic dry fruits directly from
              Jammu to families without compromising quality. Every product is sourced carefully, packed
              freshly, and delivered with honesty.
            </p>
            <Link href="/about" className="btn-light mt-7">Read more</Link>
          </div>
        </div>
      </section>

      <Section eyebrow="Good to know" title="Common questions">
        <div className="max-w-[820px]"><FaqList items={FAQS.slice(0, 4)} /></div>
        <Link href="/faq" className="mt-6 inline-block border-b border-amber pb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em]">
          All questions →
        </Link>
      </Section>
    </>
  );
}

function Section({ eyebrow, title, lede, more, children, tight }: {
  eyebrow: string; title: string; lede?: string;
  more?: { href: string; label: string }; children: React.ReactNode; tight?: boolean;
}) {
  return (
    <section className={`${tight ? "pt-0" : "pt-14 md:pt-20"} pb-14 md:pb-20`}>
      <div className="wrap">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="mt-2.5 text-[clamp(30px,4vw,46px)]">{title}</h2>
            {lede && <p className="mt-2 max-w-[52ch] text-muted">{lede}</p>}
          </div>
          {more && (
            <Link href={more.href} className="whitespace-nowrap border-b border-amber pb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em]">
              {more.label} →
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function CategoryTile({ href, img, title, sub }: { href: string; img: string; title: string; sub: string }) {
  return (
    <Link href={href} className="group relative block aspect-[16/10] overflow-hidden rounded-[3px] bg-ink">
      <Image src={img} alt={title} fill sizes="(max-width:768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(180deg,transparent_30%,rgba(20,16,14,.82))] p-7 text-white">
        <h3 className="text-[32px] text-white">{title}</h3>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-[#C9BEB1]">{sub}</span>
      </div>
    </Link>
  );
}
