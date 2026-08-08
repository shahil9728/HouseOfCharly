import type { Metadata } from "next";
import { Policy } from "@/components/Policy";
export const metadata: Metadata = { title: "Privacy Policy", description: "What we collect, why, and what we never do with it.", alternates: { canonical: "/privacy" } };
export default function Page() {
  return (
    <Policy title="Privacy policy" lede="What we collect, why, and what we never do with it.">
      <h3>What we collect</h3>
      <p>When you place an order we collect your name, contact number and delivery address. That is the minimum we need to deliver to you and confirm your order.</p>
      <h3>How your cart works</h3>
      <p>Your cart is stored locally in your own browser. It is not uploaded to a server and it is not linked to your identity until you choose to send us your order.</p>
      <h3>Analytics</h3>
      <p>We use standard website analytics to understand which products people are interested in and where the site can be improved. This data is aggregated and is not used to identify you personally.</p>
      <h3>What we never do</h3>
      <p>We do not sell, rent or trade your personal information to anyone. We do not send marketing messages to your number unless you ask us to.</p>
      <h3>Contact</h3>
      <p>For any privacy question, or to ask us to delete your details, email Official@houseofcharly.com.</p>
    </Policy>
  );
}
