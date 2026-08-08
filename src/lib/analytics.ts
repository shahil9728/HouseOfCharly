/* Single choke point for every tracked event.
   Add NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID and events start flowing
   with no other change anywhere in the codebase. */
type Params = Record<string, unknown>;

const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  search: "Search",
  begin_checkout: "InitiateCheckout",
  whatsapp_order: "Purchase"
};

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...a: unknown[]) => void;
    fbq?: (...a: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
  if (typeof w.gtag === "function") w.gtag("event", event, params);
  if (typeof w.fbq === "function" && META_MAP[event]) w.fbq("track", META_MAP[event], params);
}
