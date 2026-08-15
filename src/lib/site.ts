export const SITE = {
  name: "House of Charly",
  tagline: "The Choice of Every Home",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://houseofcharly.com",
  phone: "+91 95188 59359",
  phoneRaw: "+919518859359",
  email: "Official@houseofcharly.com",
  wa: process.env.NEXT_PUBLIC_WA_NUMBER ?? "919518859359",
  freeShippingOver: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_OVER ?? 999),
  shippingFlat: Number(process.env.NEXT_PUBLIC_SHIPPING_FLAT ?? 79),

  /* ---------------------------------------------------------------------
   * Business identity for structured data.
   *
   * Google can only show a knowledge panel, a brand logo or a local result for
   * a business it can name precisely. This is the real registered shop address
   * (confirmed against the owner's Google Business Profile listing and
   * geocoded to the same neighbourhood — Hisar, not Jammu). "Sourced from
   * Jammu" in the site's copy is about where the produce comes from, not where
   * the shop operates from; the two are different facts and both are correct.
   * ------------------------------------------------------------------- */
  street: process.env.NEXT_PUBLIC_STREET_ADDRESS ?? "Shop No. 7, TCP2, Sainik Adarsh Enclave",
  locality: process.env.NEXT_PUBLIC_LOCALITY ?? "Hisar",
  region: process.env.NEXT_PUBLIC_REGION ?? "Haryana",
  postalCode: process.env.NEXT_PUBLIC_POSTAL_CODE ?? "125006",
  country: "IN",

  /* Lat/lng and the Business Profile link, matched to the geocoded address
     above. `geo` + `hasMap` in schema is what lets Google tie this exact
     listing to the site rather than guessing from the address text alone. */
  geo: { lat: 29.1132239, lng: 75.8165405 },
  googleMapsUrl:
    "https://www.google.com/maps/place/House+of+charly/@29.1132903,75.8163774,17z/data=!3m1!4b1!4m6!3m5!1s0x39123788183c1b3f:0x4d12f99a64053ed9!8m2!3d29.1132239!4d75.8165405!16s%2Fg%2F11ntct86jc",

  /* Social profiles feed schema.org `sameAs` — how Google ties this site to the
     brand's other properties. Empty values are dropped, never emitted blank. */
  social: [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/houseofcharly.in/",
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
    process.env.NEXT_PUBLIC_LINKEDIN_URL ?? ""
  ].filter(Boolean),

  /* Returns window in days. Mirrored in /returns and in Product structured
     data — keep the two in step, a mismatch is a manual-action risk. */
  returnDays: Number(process.env.NEXT_PUBLIC_RETURN_DAYS ?? 2)
};
