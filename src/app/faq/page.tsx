import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqList, FAQS } from "@/components/Faq";
import { JsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

const TITLE = "FAQs — Delivery, Payment, COD & Freshness";
const DESCRIPTION =
  "Answers on ordering, cash on delivery, online payment, delivery charges and timelines, GST, storage and replacements at House of Charly.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: { type: "website", url: `${SITE.url}/faq`, title: TITLE, description: DESCRIPTION }
};

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}/faq#faq`,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "en-IN",
    /* Tying the page back to the site and brand nodes turns three isolated
       snippets of schema into one connected graph, which is what Google needs to
       attribute the answers to this business rather than to nobody. */
    isPartOf: { "@id": `${SITE.url}/#website` },
    about: { "@id": `${SITE.url}/#organization` },
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
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
      <JsonLd data={ld} />
    </>
  );
}
