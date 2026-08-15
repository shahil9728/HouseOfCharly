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
          {/* The footer is the site's crawl backbone: it is the only place every
              page links to every other section, which is how a product page
              three clicks deep still gets found. /about was previously reachable
              only from the home page — an orphan for anyone arriving from search. */}
          <FooterCol title="Shop" links={[
            ["All Products", "/shop"], ["Dry Fruits & Nuts", "/c/dry-fruit"],
            ["Spices & Masalas", "/c/spices"], ["Offers", "/shop?filter=offers"]]} />
          <FooterCol title="Help" links={[
            ["Our Story", "/about"], ["FAQ", "/faq"], ["Shipping", "/shipping"],
            ["Returns & Refunds", "/returns"], ["Privacy Policy", "/privacy"],
            ["Terms & Conditions", "/terms"]]} />
          <div>
            <h5 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white">Get in Touch</h5>
            <p className="leading-loose">
              <a href={`tel:${SITE.phoneRaw}`} className="hover:text-amber-light">{SITE.phone}</a><br />
              <a href={`mailto:${SITE.email}`} className="hover:text-amber-light">{SITE.email}</a><br />
              <Link href="/contact" className="hover:text-amber-light">Contact us</Link>
            </p>
            {/* A crawlable anchor to the Business Profile does real work the
                schema alone can't: it's a direct citation Google can follow, and
                for a visitor it's one tap to directions. */}
            <p className="mt-3.5 leading-loose">
              <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-light">
                {SITE.street}, {SITE.locality}, {SITE.region} {SITE.postalCode}
              </a>
            </p>
            {SITE.social.length > 0 && (
              <p className="mt-4 flex gap-4">
                {SITE.social.map((href) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    aria-label={href.includes("instagram") ? "House of Charly on Instagram" : "House of Charly on social media"}
                    className="hover:text-amber-light">
                    {href.includes("instagram") ? "Instagram" : href.includes("facebook") ? "Facebook"
                      : href.includes("youtube") ? "YouTube" : href.includes("linkedin") ? "LinkedIn" : "Follow us"}
                  </a>
                ))}
              </p>
            )}
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
