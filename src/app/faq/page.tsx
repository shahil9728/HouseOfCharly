import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqList, FAQS } from "@/components/Faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Everything about ordering, delivery, payment and freshness at House of Charly.",
  alternates: { canonical: "/faq" }
};

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <section className="pb-16 pt-2">
        <div className="wrap">
          <h1 className="text-[clamp(34px,4.6vw,54px)]">Frequently asked questions</h1>
          <p className="mt-2.5 max-w-[60ch] text-[16px] text-muted">
            Everything about ordering, delivery, payment and freshness.
          </p>
          <div className="mt-7 max-w-[70ch]"><FaqList items={FAQS} /></div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
