export const SITE = {
  name: "House of Charly",
  tagline: "The Choice of Every Home",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://houseofcharly.com",
  phone: "+91 95188 59359",
  phoneRaw: "+919518859359",
  email: "Official@houseofcharly.com",
  wa: process.env.NEXT_PUBLIC_WA_NUMBER ?? "919518859359",
  freeShippingOver: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_OVER ?? 999),
  shippingFlat: Number(process.env.NEXT_PUBLIC_SHIPPING_FLAT ?? 79)
};
