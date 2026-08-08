import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ink pb-7 pt-16 text-[13.5px] text-[#A99C90]">
      <div className="wrap">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
          <div>
            <Logo tone="light" height={44} className="mb-4" />
            <p className="font-display text-[16px] italic text-[#C9BEB1]">{SITE.tagline}</p>
            <p className="mt-3.5 max-w-[34ch]">
              Dry fruits, nuts, seeds and whole spices — handpicked in Jammu, freshly packed, and delivered with care.
            </p>
          </div>
          <FooterCol title="Shop" links={[
            ["All Products", "/shop"], ["Dry Fruits", "/c/dry-fruit"],
            ["Spices", "/c/spices"], ["Offers", "/shop?filter=offers"]]} />
          <FooterCol title="Help" links={[
            ["FAQ", "/faq"], ["Shipping", "/shipping"], ["Returns & Refunds", "/returns"],
            ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"]]} />
          <div>
            <h5 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white">Get in Touch</h5>
            <p className="leading-loose">
              <a href={`tel:${SITE.phoneRaw}`} className="hover:text-amber-light">{SITE.phone}</a><br />
              <a href={`mailto:${SITE.email}`} className="hover:text-amber-light">{SITE.email}</a><br />
              <Link href="/contact" className="hover:text-amber-light">Contact us</Link>
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-5 text-[12px]">
          <span>© {new Date().getFullYear()} House of Charly. All rights reserved.</span>
          <span>Prices in INR · Inclusive of taxes</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h5 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white">{title}</h5>
      <p className="leading-loose">
        {links.map(([label, href]) => (
          <span key={href}><Link href={href} className="hover:text-amber-light">{label}</Link><br /></span>
        ))}
      </p>
    </div>
  );
}
