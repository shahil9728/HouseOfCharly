import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { razorpayReady } from "@/lib/order";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your order and pay.",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  // Keys live server-side only; the client just learns whether to offer the option.
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }, { label: "Checkout" }]} />
      <CheckoutForm onlineEnabled={razorpayReady()} />
    </>
  );
}
