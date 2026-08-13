import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, slugify, byFamily } from "@/lib/sheet";
import { ShopBrowser } from "@/components/ShopBrowser";
import { JsonLd, collectionSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const revalidate = 300;

/* ---------------------------------------------------------------------------
 * Category copy.
 *
 * A category page whose only content is a grid of cards gives Google almost no
 * text to match a query against, which is why small-shop category pages lose to
 * marketplaces. Each entry below carries a search-led title, a meta description
 * written to earn the click, and real prose about the products. The prose renders
 * *under* the grid, so it informs without pushing products below the fold.
 * ------------------------------------------------------------------------- */
interface Copy {
  h1: string;
  title: string;
  description: string;
  lede: string;
  sections: { h: string; p: string }[];
}

const COPY: Record<string, Copy> = {
  "dry-fruit": {
    h1: "Dry Fruits & Nuts",
    title: "Buy Dry Fruits Online — Cashews, Walnuts, Raisins & Seeds",
    description:
      "Buy dry fruits online from House of Charly — W-240 and W-320 cashews, walnut kernels, raisins, chuara, makhana and seeds. Sourced in Jammu, packed fresh, delivered across India.",
    lede: "Cashews, walnut kernels, raisins, makhana and seeds — handpicked and naturally dried.",
    sections: [
      {
        h: "What the cashew grades mean",
        p: "Cashews are graded by size and wholeness, not by flavour. W-240 counts roughly 240 kernels to the pound and W-320 around 320 — so W-240 kernels are visibly larger and cost more per kilo, while W-320 is the everyday grade most Indian kitchens buy. Both are whole white kernels. Broken and split grades are cheaper and perfectly good for cooking, where the kernel is going to be ground or fried anyway."
      },
      {
        h: "Buying walnuts and almonds by kernel, not shell",
        p: "Walnut prices look wildly different between sellers because some quote in-shell weight and others quote kernels. We sell akhrot kernels, so the weight you pay for is the weight you eat. Almonds are sold by grade too — the letters in our listings mark different sizes and origins, and the price follows the grade."
      },
      {
        h: "How to store dry fruits in an Indian kitchen",
        p: "Heat and humidity, not time, are what turn nuts stale. Keep them in an airtight jar out of direct sunlight, and refrigerate the oily ones — walnuts, cashews and seeds — through the monsoon and summer. Bought in the pack sizes we list rather than in bulk, most households finish a pack long before freshness becomes a question."
      },
      {
        h: "Packed in small batches",
        p: "Every order is cleaned, sorted and sealed the week it ships rather than drawn from a pre-packed pallet. That is the whole reason a small shop can beat a marketplace on a food product: the stock moves fast enough that nothing sits."
      }
    ]
  },
  spices: {
    h1: "Spices & Masalas",
    title: "Buy Whole Spices & Masala Powders Online — Ground in Small Batches",
    description:
      "Buy whole spices and masala powders online from House of Charly — jeera, saunf, elaichi, black pepper, haldi, dhaniya and lal mirch. Ground in small batches, delivered across India.",
    lede: "Whole spices, ground powders and everyday masala blends, packed in small batches.",
    sections: [
      {
        h: "Whole or ground?",
        p: "A spice keeps its aroma in the seed and starts losing it the moment the oils meet air. Whole jeera, saunf, elaichi and pepper hold their character for months and let you dry-roast before grinding. Powders are the convenience, and the trade-off is time: a powder is at its best in the weeks after milling, which is why we grind in small batches instead of filling a year's stock at once."
      },
      {
        h: "The everyday four",
        p: "Most Indian cooking runs on haldi, dhaniya, lal mirch and jeera, and those four are where a quality difference shows most. Good haldi is deeply pigmented rather than sandy yellow; good dhaniya smells citrus-sweet rather than dusty; and chilli varies enormously in heat — Teja is markedly sharper than a standard lal mirch, which is why we list them separately instead of selling one generic chilli powder."
      },
      {
        h: "Keeping powders alive",
        p: "Store powders away from the stove. The cupboard directly above the burner is the most common place to keep masalas and the worst one: steam and heat flatten them within weeks. A closed shelf away from the hob, in an opaque container, keeps a pack tasting the way it did when it arrived."
      },
      {
        h: "Nothing added",
        p: "These are single spices and simple blends — cleaned, sorted, packed. No colour, no bulking agent, no anti-caking filler. If a powder looks less uniform than a branded pouch, that is what unadulterated ground spice actually looks like."
      }
    ]
  }
};

/** Fallback for any category added to the sheet later. */
const fallback = (name: string): Copy => ({
  h1: name,
  title: `Buy ${name} Online`,
  description: `Shop ${name} from House of Charly — sourced in Jammu, freshly packed and delivered across India. Free delivery over ₹${SITE.freeShippingOver}.`,
  lede: `Our full range of ${name.toLowerCase()}, packed fresh in small batches.`,
  sections: []
});

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ category: slugify(c) }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const { categories } = await getCatalog();
  const match = categories.find((c) => slugify(c) === category);
  if (!match) return { title: "Not found", robots: { index: false, follow: true } };

  const copy = COPY[category] ?? fallback(match);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/c/${category}` },
    openGraph: {
      type: "website",
      url: `${SITE.url}/c/${category}`,
      title: copy.title,
      description: copy.description
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const { products, categories } = await getCatalog();
  const match = categories.find((c) => slugify(c) === category);
  if (!match) notFound();

  const copy = COPY[category] ?? fallback(match);
  const inCategory = products.filter((p) => p.sellable && p.category === match);
  const other = categories.filter((c) => c !== match);

  return (
    <>
      <ShopBrowser
        products={byFamily(inCategory)}
        title={copy.h1}
        lede={copy.lede}
        crumbs={[{ label: "Home", href: "/" }, { label: copy.h1 }]}
        lockedCategory={match}
      >
        {copy.sections.length > 0 && (
          <section className="border-t border-line bg-[#FBF7F1] py-14 md:py-16">
            <div className="wrap">
              <div className="eyebrow">Buying guide</div>
              <h2 className="mt-2.5 max-w-[28ch] text-[clamp(28px,3.4vw,42px)]">
                About our {copy.h1.toLowerCase()}
              </h2>
              <div className="mt-9 grid gap-x-12 gap-y-9 md:grid-cols-2">
                {copy.sections.map((s) => (
                  <article key={s.h}>
                    <h3 className="text-[21px]">{s.h}</h3>
                    <p className="mt-2.5 max-w-[62ch] text-muted">{s.p}</p>
                  </article>
                ))}
              </div>

              {/* Sideways links between categories spread crawl depth and give a
                  visitor who landed here from search somewhere else to go. */}
              {other.length > 0 && (
                <p className="mt-11 border-t border-line pt-6 text-[14px] text-muted">
                  Also from House of Charly:{" "}
                  {other.map((c, i) => (
                    <span key={c}>
                      {i > 0 && " · "}
                      <Link href={`/c/${slugify(c)}`} className="border-b border-amber pb-0.5 text-ink">
                        {c}
                      </Link>
                    </span>
                  ))}
                  {" · "}
                  <Link href="/shop" className="border-b border-amber pb-0.5 text-ink">
                    the full range
                  </Link>
                </p>
              )}
            </div>
          </section>
        )}
      </ShopBrowser>

      <JsonLd
        data={collectionSchema({
          name: copy.h1,
          description: copy.description,
          path: `/c/${category}`,
          products: inCategory
        })}
      />
    </>
  );
}
