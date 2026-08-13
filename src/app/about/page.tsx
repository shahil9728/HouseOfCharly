import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { HERO_SLIDES } from "@/lib/slides";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/lib/seo";

const TITLE = "Our Story — Dry Fruits Sourced Direct from Jammu";
const DESCRIPTION =
  "House of Charly brings authentic dry fruits, nuts and spices directly from trusted farms in Jammu to families across India — cleaned, sorted and packed in small batches.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { type: "website", url: `${SITE.url}/about`, title: TITLE, description: DESCRIPTION }
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Our Story" }]} />
      <section className="pb-16 pt-2">
        <div className="wrap max-w-[760px]">
          <div className="eyebrow">Our Story</div>
          <h1 className="mt-3.5 text-[clamp(38px,5.4vw,64px)]">Every great home deserves food it can trust.</h1>
          <p className="mt-5 text-[18px] text-muted">
            House of Charly began with one simple mission — bring authentic dry fruits directly from
            Jammu to families without compromising quality. Every product is sourced carefully, packed
            freshly, and delivered with honesty.
          </p>
        </div>
        <div className="wrap mt-11">
          <div className="relative aspect-[16/7] overflow-hidden rounded-[3px]">
            <Image src={HERO_SLIDES[3].img} alt="The House of Charly range" fill sizes="100vw" className="object-cover" />
          </div>
        </div>
        <div className="wrap mt-12 max-w-[70ch]">
          <h2 className="mb-3 mt-9 text-[32px]">What we sell</h2>
          <p className="text-muted">
            Two ranges, both packed under our own label. <b>Dry fruits and nuts</b> — cashews, walnut
            kernels, raisins, chuara, makhana, and seeds including chia, basil, pumpkin and sunflower.
            <b> Spices and masalas</b> — whole spices like jeera, saunf, black pepper and elaichi,
            alongside everyday blends such as garam masala, kitchen king and chana masala.
          </p>
          <h2 className="mb-3 mt-9 text-[32px]">How we pack</h2>
          <p className="text-muted">
            Small batches, sealed pouches and jars, and a simple promise printed on every pack:
            100% natural, no additives, rich aroma, hygienically packed. Nothing is decanted from bulk
            sacks after the fact.
          </p>
          <h2 className="mb-3 mt-9 text-[32px]">How to reach us</h2>
          <p className="text-muted">
            We are a small team and we like talking to our customers directly. That is why we confirm
            every order personally — it lets us check freshness, delivery timing and quantities with you
            before anything ships.
          </p>
          <Link href="/shop" className="btn-primary mt-7">Shop the collection</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": `${SITE.url}/about#about`,
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE.url}/about`,
          inLanguage: "en-IN",
          isPartOf: { "@id": `${SITE.url}/#website` },
          mainEntity: { "@id": `${SITE.url}/#organization` }
        }}
      />
    </>
  );
}
