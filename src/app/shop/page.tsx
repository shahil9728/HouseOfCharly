import type { Metadata } from "next";
import { getProducts, byFamily, interleave } from "@/lib/sheet";
import { ShopBrowser } from "@/components/ShopBrowser";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Every House of Charly product — dry fruits, nuts, seeds, whole spices and everyday masalas. Live prices and stock.",
  alternates: { canonical: "/shop" }
};

export default async function ShopPage() {
  // one card per product family; pack sizes are chosen on the product page
  const products = interleave(byFamily(await getProducts()));
  return (
    <ShopBrowser
      products={products}
      title="Shop All Products"
      lede="Live from our inventory sheet. Open any product to pick your pack size."
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop All" }]}
    />
  );
}
