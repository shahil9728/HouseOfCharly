export const SITE = {
  name: "House of Charly",
  tagline: "The Choice of Every Home",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://houseofcharly.com",
  phone: "+91 70150 27484",
  phoneRaw: "+917015027484",
  email: "Official@houseofcharly.com",
  wa: process.env.NEXT_PUBLIC_WA_NUMBER ?? "917015027484",
  freeShippingOver: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_OVER ?? 999),
  shippingFlat: Number(process.env.NEXT_PUBLIC_SHIPPING_FLAT ?? 79)
};
