import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* A web manifest is what lets the storefront be saved to an Android home screen
   with the brand mark instead of a generic globe. It is also one of the checks
   Lighthouse runs, and Lighthouse scores are what most owners are shown when
   someone audits the site. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: "Charly",
    description:
      "Premium dry fruits, nuts, seeds and whole spices sourced from Jammu and delivered across India.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBF7F1",
    theme_color: "#14100E",
    lang: "en-IN",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icon-mark.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logo-charly.png", sizes: "any", type: "image/png" }
    ]
  };
}
