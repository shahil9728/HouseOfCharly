import { SITE } from "@/lib/site";

/* These answers are published as FAQPage structured data, so they are read by
   Google as statements of fact about the business — an answer that contradicts
   the checkout or the shipping page is a misrepresentation, not just stale copy.
   Keep them in step with /shipping, /returns and the actual payment options.

   The set also does keyword work: each question is phrased the way a shopper
   would type it, which is what lets an answer surface for a long-tail query. */
export const FAQS: [string, string][] = [
  ["How do I place an order?", "Add what you want to your cart and go to checkout. Fill in your name, number and delivery address, choose Cash on Delivery or pay online, and place the order. You get an order reference immediately, and we confirm stock and the delivery window with you personally."],
  ["Do I need to create an account?", "No. There is no sign-up and no login. Your cart is saved in your own browser, and you check out with just your name, number and address."],
  ["How do I pay?", "Cash on Delivery is available across our serviceable areas. Online payment covers UPI, credit and debit cards, net banking and wallets, and is processed securely — we never see or store your card details."],
  ["Is cash on delivery available?", "Yes. Choose Cash on Delivery at checkout and pay the courier when your parcel arrives. There is no extra charge for paying this way."],
  ["What are the delivery charges?", `Delivery is free on orders above ₹${SITE.freeShippingOver}. Below that, a flat ₹${SITE.shippingFlat} applies. Exact timelines are confirmed before dispatch.`],
  ["Do you deliver across India?", "Yes, we ship nationwide. Serviceability for your PIN code is confirmed when we acknowledge your order — if we cannot reach your area we will tell you immediately and nothing is charged."],
  ["How long does delivery take?", "Orders are packed and dispatched within 1–2 working days, and most parcels arrive within 2–7 days of dispatch depending on your location. Tracking details are shared on the same thread as your order."],
  ["Where do your products come from?", "Our dry fruits are sourced directly from trusted farms in Jammu. Spices are cleaned, sorted and packed in small batches to protect their aroma."],
  ["Are the prices inclusive of GST?", "Yes. Every price shown on the site is the final price in Indian rupees, inclusive of taxes. The only thing that can be added is the delivery charge on orders below the free-delivery threshold."],
  ["Is the stock shown on the site accurate?", "Yes. Stock levels come straight from our live inventory sheet, so what you see is what we hold. If something sells out between your order and our confirmation, we will tell you immediately."],
  ["How should I store dry fruits and spices?", "Keep everything in an airtight container away from sunlight and away from the cupboard above your stove. Refrigerate oily items like walnuts, cashews and seeds during summer and the monsoon. Whole spices keep their aroma far longer than ground ones."],
  ["Can I order in bulk or for gifting?", `Absolutely — message us on ${SITE.phone} and we will put together a quote.`],
  ["What if something arrives damaged?", "Send us a photo of the item and its packaging within 48 hours of delivery, quoting your order reference, and we will arrange a replacement or a full refund."]
];

export function FaqList({ items }: { items: [string, string][] }) {
  return (
    <div>
      {items.map(([q, a]) => (
        <details key={q} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-[21px] [&::-webkit-details-marker]:hidden">
            <span>{q}</span>
            <span className="text-amber transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p className="max-w-[74ch] pb-5 text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
