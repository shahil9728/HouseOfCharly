import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/sheet";
import { ShopBrowser } from "@/components/ShopBrowser";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Every House of Charly product — dry fruits, nuts, seeds, whole spices and everyday masalas. Live prices and stock.",
  alternates: { canonical: "/shop" }
};

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <Suspense fallback={null}>
      <ShopBrowser
      products={products}
      title="Shop All Products"
      lede="Every product below is live from our inventory sheet — prices and stock update automatically."
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop All" }]}
    />
    </Suspense>
  );
}
