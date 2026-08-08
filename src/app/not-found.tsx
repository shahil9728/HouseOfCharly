import Link from "next/link";

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
      </div>
    </section>
  );
}
