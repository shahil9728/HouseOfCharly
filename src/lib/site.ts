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
   * a business it can name precisely. Locality is safe to hard-code (the whole
   * brand story is Jammu sourcing); the street address is env-driven because
   * inventing one would be worse than omitting it — a wrong address gets a
   * listing rejected, a missing one merely gets less detail.
   * ------------------------------------------------------------------- */
  street: process.env.NEXT_PUBLIC_STREET_ADDRESS ?? "",
  locality: process.env.NEXT_PUBLIC_LOCALITY ?? "Jammu",
  region: process.env.NEXT_PUBLIC_REGION ?? "Jammu and Kashmir",
  postalCode: process.env.NEXT_PUBLIC_POSTAL_CODE ?? "",
  country: "IN",

  /* Social profiles feed schema.org `sameAs` — how Google ties this site to the
     brand's other properties. Empty values are dropped, never emitted blank. */
  social: [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
    process.env.NEXT_PUBLIC_LINKEDIN_URL ?? ""
  ].filter(Boolean),

  /* Returns window in days. Mirrored in /returns and in Product structured
     data — keep the two in step, a mismatch is a manual-action risk. */
  returnDays: Number(process.env.NEXT_PUBLIC_RETURN_DAYS ?? 2)
};
