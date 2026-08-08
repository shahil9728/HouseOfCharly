import Link from "next/link";
import { SITE } from "@/lib/site";

export interface Crumb { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.label,
      ...(c.href ? { item: `${SITE.url}${c.href}` } : {})
    }))
  };
  return (
    <>
      <nav aria-label="Breadcrumb" className="wrap py-5 text-[11.5px] text-faint">
        {items.map((c, i) => (
          <span key={c.label}>
            {c.href ? <Link href={c.href} className="hover:text-amber">{c.label}</Link>
                    : <span className="text-muted">{c.label}</span>}
            {i < items.length - 1 && <span className="mx-2">/</span>}
          </span>
        ))}
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
