import type { Metadata, Viewport } from "next";
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
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/seo";

const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"], variable: "--font-display", display: "swap"
});
const sans = Inter({
  subsets: ["latin"], weight: ["400", "500", "600", "700"],
  variable: "--font-sans", display: "swap"
});

/* Title leads with the transactional phrase people actually search ("buy dry
   fruits online"), not with the brand — nobody searches a brand they haven't
   heard of yet. The brand still closes the title for recognition on repeat
   impressions. */
const DEFAULT_TITLE = "Buy Dry Fruits & Spices Online — Sourced from Jammu | House of Charly";
const DEFAULT_DESCRIPTION =
  "Buy premium dry fruits, nuts, seeds and whole spices at House of Charly. Handpicked in Jammu, freshly packed in small batches, delivered across India. Free delivery over ₹999.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | House of Charly"
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE.name,
  /* Google ignores the keywords meta; Bing and some regional engines still read
     it, and it costs nothing. Kept short and honest rather than stuffed. */
  keywords: [
    "buy dry fruits online",
    "dry fruits online India",
    "Jammu dry fruits",
    "cashews online",
    "walnut kernels online",
    "whole spices online",
    "masala online India",
    "House of Charly"
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Food & Grocery",
  openGraph: {
    type: "website", siteName: SITE.name, locale: "en_IN", url: SITE.url,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  alternates: {
    canonical: "/",
    /* One language, but declaring it stops Google guessing and lets an en-IN
       result be preferred for Indian searchers. */
    languages: { "en-IN": SITE.url, "x-default": SITE.url }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      /* Without these Google may show a thumbnail and a clipped snippet on a
         shopping-intent result. Large previews earn materially more clicks. */
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  /* Paste the Search Console HTML-tag token here via env if you verify by meta
     tag rather than DNS. Omitted entirely when unset. */
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: true, address: true, email: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14100E"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();

  return (
    /* en-IN, not en: the copy, currency, spellings and delivery area are all
       Indian, and the region hint helps Google serve this to the right market. */
    <html lang="en-IN" className={`${display.variable} ${sans.variable}`}>
      <head>
        {/* The product photography lives on a third-party host, so the browser
            must resolve DNS and complete a TLS handshake before the largest
            image on the page can even start downloading. Warming the connection
            in the head takes that cost off the critical path for LCP. */}
        <link rel="preconnect" href="https://pub.hyperagent.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://pub.hyperagent.com" />
      </head>
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
        {/* Emitted once, site-wide. Every other page's schema references these
            two nodes by @id instead of restating the business. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </body>
    </html>
  );
}
