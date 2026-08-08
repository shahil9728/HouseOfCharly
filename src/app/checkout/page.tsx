import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your order and send it to us.",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }, { label: "Checkout" }]} />
      <CheckoutForm />
    </>
  );
}
