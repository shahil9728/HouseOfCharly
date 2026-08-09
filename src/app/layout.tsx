import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { getProducts } from "@/lib/sheet";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartBar } from "@/components/CartBar";
import { Celebration } from "@/components/Celebration";
import { Toast } from "@/components/Toast";
import { Analytics } from "@/components/Analytics";
import { SITE } from "@/lib/site";

const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"], variable: "--font-display", display: "swap"
});
const sans = Inter({
  subsets: ["latin"], weight: ["400", "500", "600", "700"],
  variable: "--font-sans", display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "House of Charly — Dry Fruits & Spices, Sourced from Jammu",
    template: "%s | House of Charly"
  },
  description:
    "Premium dry fruits, nuts, seeds and whole spices from House of Charly. Handpicked in Jammu, freshly packed in small batches and delivered with care.",
  openGraph: {
    type: "website", siteName: SITE.name, locale: "en_IN", url: SITE.url,
    title: "House of Charly — Dry Fruits & Spices, Sourced from Jammu",
    description: "Handpicked in Jammu, freshly packed in small batches."
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();

  const org = {
    "@context": "https://schema.org", "@type": "Organization",
    name: SITE.name, slogan: SITE.tagline, url: SITE.url,
    telephone: SITE.phoneRaw, email: SITE.email
  };

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:bg-ink focus:px-5 focus:py-3 focus:text-white">
          Skip to content
        </a>
        <CartProvider products={products}>
          <Header products={products} />
          <main id="main">{children}</main>
          <Footer />
          <CartBar />
          <CartDrawer />
          <Celebration />
          <Toast />
        </CartProvider>
        <Analytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      </body>
    </html>
  );
}
