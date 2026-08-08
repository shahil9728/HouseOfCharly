import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about a product, a bulk order or a delivery? Reach House of Charly.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <section className="pb-16 pt-2">
        <div className="wrap">
          <h1 className="text-[clamp(34px,4.6vw,54px)]">Contact us</h1>
          <p className="mt-2.5 max-w-[56ch] text-muted">
            Questions about a product, a bulk order or an existing delivery? We are happy to help.
          </p>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            <Card title="Phone & WhatsApp" big={SITE.phone} note="Mon–Sat, 10am–7pm IST">
              <a className="btn-wa mt-4" href={waLink("Hi! I have a question about a product.")}
                target="_blank" rel="noopener noreferrer">Start a chat</a>
            </Card>
            <Card title="Email" big={SITE.email} note="We reply within one working day.">
              <a className="btn-ghost mt-4" href={`mailto:${SITE.email}`}>Send an email</a>
            </Card>
            <Card title="Bulk & Gifting" note="Festive hampers, corporate gifting and wholesale quantities — tell us what you need and we will quote.">
              <a className="btn-ghost mt-4" href={waLink("Hi! I'd like a quote for a bulk / gifting order.")}
                target="_blank" rel="noopener noreferrer">Request a quote</a>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

function Card({ title, big, note, children }: {
  title: string; big?: string; note: string; children: React.ReactNode;
}) {
  return (
    <div className="border border-line bg-white p-6">
      <div className="eyebrow">{title}</div>
      {big && <p className="mt-2.5 break-words font-display text-[24px] text-txt">{big}</p>}
      <p className="mt-1.5 text-[13px] text-muted">{note}</p>
      {children}
    </div>
  );
}
