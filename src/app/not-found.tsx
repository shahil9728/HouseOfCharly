import Link from "next/link";
import type { Metadata } from "next";

/* A 404 must never be indexable. Next already serves the correct HTTP status,
   which is what Google actually acts on, but the explicit noindex closes the
   gap for crawlers that render before reading the status line. */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="wrap text-center">
        <div className="eyebrow">Error 404</div>
        <h1 className="mt-3 text-[clamp(58px,11vw,120px)]">Not found</h1>
        <p className="mx-auto mt-3.5 max-w-[44ch] text-muted">
          This page doesn&apos;t exist — it may have moved, or the product may no longer be in our catalogue.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">Shop all products</Link>
          <Link href="/" className="btn-ghost">Back home</Link>
        </div>

        {/* Links out of a dead end recover the visit and keep the crawler moving
            through the catalogue instead of stopping here. */}
        <p className="mt-9 text-[14px] text-muted">
          Try{" "}
          <Link href="/c/dry-fruit" className="border-b border-amber pb-0.5 text-ink">dry fruits &amp; nuts</Link>,{" "}
          <Link href="/c/spices" className="border-b border-amber pb-0.5 text-ink">spices &amp; masalas</Link>, or{" "}
          <Link href="/faq" className="border-b border-amber pb-0.5 text-ink">our FAQs</Link>.
        </p>
      </div>
    </section>
  );
}
