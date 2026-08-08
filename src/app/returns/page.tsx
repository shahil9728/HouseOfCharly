import type { Metadata } from "next";
import { Policy } from "@/components/Policy";
export const metadata: Metadata = { title: "Returns & Refunds", description: "Our returns, replacement and refund policy.", alternates: { canonical: "/returns" } };
export default function Page() {
  return (
    <Policy title="Returns & refunds" lede="Food safety comes first — but you should never be stuck with a bad pack.">
      <h3>What we replace</h3>
      <ul>
        <li>Items that arrive damaged, leaking or broken.</li>
        <li>Incorrect items, wrong weights or missing items from your order.</li>
        <li>Packs that are past, or very close to, their best-before date on arrival.</li>
      </ul>
      <h3>How to raise it</h3>
      <p>Send a photo of the item and its packaging to +91 70150 27484 within <b>48 hours</b> of delivery, quoting your order reference. We will arrange a replacement or a full refund.</p>
      <h3>What we cannot accept</h3>
      <p>For food-safety reasons, opened or partially used food packs cannot be returned unless the product is defective. Please check your parcel on arrival.</p>
      <h3>Refund timelines</h3>
      <p>Approved refunds are processed to your original payment method within 5–7 working days.</p>
    </Policy>
  );
}
