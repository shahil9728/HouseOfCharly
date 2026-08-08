import type { Metadata } from "next";
import { Policy } from "@/components/Policy";
export const metadata: Metadata = { title: "Shipping Policy", description: "How and when your House of Charly order reaches you.", alternates: { canonical: "/shipping" } };
export default function Page() {
  return (
    <Policy title="Shipping policy" lede="How and when your order reaches you.">
      <h3>Delivery charges</h3>
      <ul><li>Free delivery on all orders above ₹999.</li><li>A flat ₹79 delivery charge applies to orders below ₹999.</li></ul>
      <h3>Dispatch time</h3>
      <p>Orders are packed and dispatched within 1–2 working days of confirmation. Because every order is confirmed personally, we will tell you the expected delivery window before we ship.</p>
      <h3>Delivery area</h3>
      <p>We deliver across India. Serviceability for your PIN code is confirmed when we acknowledge your order. If we cannot reach your area we will tell you immediately and nothing will be charged.</p>
      <h3>Tracking</h3>
      <p>Tracking details are shared on the same thread as your order.</p>
    </Policy>
  );
}
