import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

/* The cart lives in a drawer; /cart exists so a shared or bookmarked URL never
   404s. It is a permanent (308) redirect rather than a temporary one so any
   crawler that reaches it consolidates on /checkout instead of keeping /cart in
   its index as a separate URL. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CartPage() {
  permanentRedirect("/checkout");
}
