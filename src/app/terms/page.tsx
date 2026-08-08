import type { Metadata } from "next";
import { Policy } from "@/components/Policy";
export const metadata: Metadata = { title: "Terms & Conditions", description: "The basics of buying from House of Charly.", alternates: { canonical: "/terms" } };
export default function Page() {
  return (
    <Policy title="Terms & conditions" lede="The basics of buying from House of Charly.">
      <h3>Orders</h3>
      <p>Placing an order through this website starts a conversation; it is not a completed sale. An order is confirmed only once we acknowledge it and confirm stock and delivery.</p>
      <h3>Pricing and availability</h3>
      <p>Prices and stock shown on this site are drawn from our live inventory and are accurate to the best of our knowledge. In the rare case of a pricing error or a stock-out between your order and our confirmation, we will contact you before proceeding — you are never charged for something we cannot supply.</p>
      <h3>Product images</h3>
      <p>Product photography is representative. Natural products vary in size, shade and appearance between batches.</p>
      <h3>Governing law</h3>
      <p>These terms are governed by the laws of India.</p>
    </Policy>
  );
}
