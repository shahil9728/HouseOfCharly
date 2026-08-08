import type { Slide } from "@/components/Hero";

const CDN = "https://pub.hyperagent.com/api/published/";

/* Hero imagery. Move these to a `hero_slides` tab in the Sheet if the owner
   wants to swap campaign creative without a deploy. */
export const HERO_SLIDES: Slide[] = [
  {
    img: CDN + "pbf01KZG45Q43_YZZ7CMVBFVTJRGAF/hero-cashews-house-of-charly.jpg",
    alt: "Whole cashew nuts spilling from a dark wooden bowl onto a warm stone surface",
    eyebrow: "The Choice of Every Home",
    title: "Dry fruits & spices,", titleEm: "sourced from Jammu.",
    lede: "Handpicked from trusted farms, freshly packed in small batches and delivered to your door.",
    cta: "Shop the Collection", href: "/shop"
  },
  {
    img: CDN + "pbf01KZG45R1N_5F6X9NZWBB898Y32/hero-walnut-kernels-house-of-charly.jpg",
    alt: "Golden walnut kernels heaped in a rustic wooden bowl on natural burlap cloth",
    eyebrow: "Dry Fruits & Nuts",
    title: "Akhrot kernels,", titleEm: "naturally dried.",
    lede: "Walnuts, cashews, raisins and chuara — cleaned, sorted and sealed the week you order them.",
    cta: "Shop Dry Fruits", href: "/c/dry-fruit"
  },
  {
    img: CDN + "pbf01KZG45QSF_XKW4N7TEBC7854NW/hero-whole-spices-house-of-charly.jpg",
    alt: "Whole Indian spices and ground powders arranged on a dark slate surface",
    eyebrow: "Spices & Masalas",
    title: "Ground fresh,", titleEm: "in small batches.",
    lede: "Jeera, saunf, elaichi and black pepper, alongside the everyday blends your kitchen runs on.",
    cta: "Shop Spices", href: "/c/spices"
  },
  {
    img: CDN + "pbf01KZG45R9Z_ACZMF8KF4E0CK8TD/hero-seeds-dried-fruit-house-of-charly.jpg",
    alt: "Chia, pumpkin and sunflower seeds with raisins and makhana in dark stoneware bowls",
    eyebrow: "Seeds & Everyday Staples",
    title: "Chia, pumpkin", titleEm: "& sunflower.",
    lede: "The small things you add to every bowl — sourced clean, with nothing else mixed in.",
    cta: "Shop Seeds", href: "/c/dry-fruit"
  }
];
