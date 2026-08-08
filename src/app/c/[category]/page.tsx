import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCatalog, slugify } from "@/lib/sheet";
import { ShopBrowser } from "@/components/ShopBrowser";

export const revalidate = 300;

const COPY: Record<string, { title: string; lede: string }> = {
  "dry-fruit": {
    title: "Dry Fruits & Nuts",
    lede: "Cashews, walnut kernels, raisins, makhana and seeds — handpicked and naturally dried."
  },
  spices: {
    title: "Spices & Masalas",
    lede: "Whole spices, ground powders and everyday masala blends, packed in small batches."
  }
};

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ category: slugify(c) }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const { categories } = await getCatalog();
  const match = categories.find((c) => slugify(c) === category);
  if (!match) return { title: "Not found" };
  const copy = COPY[category] ?? { title: match, lede: "" };
  return {
    title: copy.title,
    description: copy.lede || `Shop ${match} from House of Charly.`,
    alternates: { canonical: `/c/${category}` }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const { products, categories } = await getCatalog();
  const match = categories.find((c) => slugify(c) === category);
  if (!match) notFound();

  const copy = COPY[category] ?? { title: match, lede: "" };
  return (
    <Suspense fallback={null}>
      <ShopBrowser
      products={products.filter((p) => p.sellable && p.category === match)}
      title={copy.title}
      lede={copy.lede}
      crumbs={[{ label: "Home", href: "/" }, { label: copy.title }]}
      lockedCategory={match}
    />
    </Suspense>
  );
}
