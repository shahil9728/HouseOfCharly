import { SITE } from "@/lib/site";

export const FAQS: [string, string][] = [
  ["How do I place an order?", "Add what you want to your cart, go to checkout, and fill in your name, number and address. We generate a complete order message and open it in WhatsApp — you just hit send. We then confirm stock, delivery and payment with you personally."],
  ["Do I need to create an account?", "No. There is no sign-up and no login. Your cart is saved in your own browser, and orders are placed directly over WhatsApp."],
  ["How do I pay?", "Payment is arranged once we confirm your order — UPI, bank transfer or cash on delivery where available. Online card payment will be added to the website later."],
  ["What are the delivery charges?", "Delivery is free on orders above ₹999. Below that, a flat ₹79 applies. Exact timelines are confirmed before dispatch."],
  ["Where do your products come from?", "Our dry fruits are sourced directly from trusted farms in Jammu. Spices are cleaned, sorted and packed in small batches to protect their aroma."],
  ["Is the stock shown on the site accurate?", "Yes. Stock levels come straight from our live inventory sheet, so what you see is what we hold. If something sells out between your order and our confirmation, we will tell you immediately."],
  ["Can I order in bulk or for gifting?", `Absolutely — message us on ${SITE.phone} and we will put together a quote.`],
  ["What if something arrives damaged?", "Send us a photo within 48 hours of delivery and we will replace it in full."]
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
