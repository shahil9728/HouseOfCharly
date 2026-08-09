import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { OrderSuccess } from "@/components/OrderSuccess";

export const metadata: Metadata = {
  title: "Order Placed",
  description: "Thank you — your House of Charly order has been placed.",
  robots: { index: false, follow: false }
};

export default function OrderSuccessPage() {
  return (
    <section className="pb-20 pt-10">
      <div className="wrap max-w-[640px] text-center">
        <OrderSuccess />

        <div className="mt-10 border-t border-line pt-8 text-[14px] text-muted">
          <p>
            Questions about your order? Call or message us on{" "}
            <a href={`tel:${SITE.phoneRaw}`} className="font-medium text-txt underline underline-offset-2">
              {SITE.phone}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary">Continue Shopping</Link>
            <Link href="/" className="btn-ghost">Back Home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
