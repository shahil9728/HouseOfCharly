import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, byFamily, interleave, slugify } from "@/lib/sheet";
import { ShopBrowser } from "@/components/ShopBrowser";
import { JsonLd, collectionSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const TITLE = "Shop All Dry Fruits & Spices Online";
const DESCRIPTION =
  "Every House of Charly product in one place — cashews, walnuts, raisins, seeds, whole spices and everyday masalas. Live prices and stock, free delivery over ₹999.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/shop" },
  openGraph: { type: "website", url: `${SITE.url}/shop`, title: TITLE, description: DESCRIPTION }
};

export default async function ShopPage() {
  const { products, categories } = await getCatalog();
  const live = products.filter((p) => p.sellable);
  // one card per product family; pack sizes are chosen on the product page
  const cards = interleave(byFamily(live));

  return (
    <>
      <ShopBrowser
        products={cards}
        title="Shop All Products"
        lede="Live from our inventory sheet. Open any product to pick your pack size."
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop All" }]}
      >
        <section className="border-t border-line bg-[#FBF7F1] py-14 md:py-16">
          <div className="wrap">
            <div className="eyebrow">Browse by category</div>
            <h2 className="mt-2.5 text-[clamp(28px,3.4vw,42px)]">Shop the full range</h2>
            <p className="mt-3 max-w-[62ch] text-muted">
              Everything here is sourced in Jammu, cleaned and sorted by hand, and sealed in small
              batches the week it ships. Prices and stock come straight from our live inventory, so a
              product shown as available genuinely is. Delivery is free on orders above ₹
              {SITE.freeShippingOver}, and a flat ₹{SITE.shippingFlat} below that.
            </p>

            {/* Text links to each category. A crawler weights an anchor in prose
                far above a filter checkbox it cannot click, and the category
                pages hold the buying-guide content worth reaching. */}
            <ul className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {categories.map((c) => {
                const n = live.filter((p) => p.category === c).length;
                return (
                  <li key={c} className="border-b border-line pb-3">
                    <Link href={`/c/${slugify(c)}`} className="text-[17px] hover:text-amber">
                      {c}
                    </Link>
                    <span className="ml-2 text-[13px] text-faint">{n} products</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </ShopBrowser>

      <JsonLd
        data={collectionSchema({
          name: TITLE,
          description: DESCRIPTION,
          path: "/shop",
          products: live
        })}
      />
    </>
  );
}
