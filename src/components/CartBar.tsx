"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { SITE } from "@/lib/site";
import { track } from "@/lib/analytics";

/**
 * Persistent basket bar, the pattern every Indian grocery app uses
 * (Blinkit / Zepto / Flipkart): once there is something in the cart a slim bar
 * sits at the bottom with the running total and a direct route to checkout.
 *
 * Tapping the summary opens the drawer to review; the button skips straight to
 * checkout. Hidden when the cart is empty and on checkout itself, and hidden on
 * mobile product pages where the page's own Add-to-Cart bar already occupies
 * that space.
 */
/** Pure so the routing rules can be unit-tested without a DOM. */
export function cartBarState(path: string, qty: number) {
  if (qty <= 0) return { show: false, desktopOnly: false };
  if (path.startsWith("/checkout") || path.startsWith("/cart")) return { show: false, desktopOnly: false };
  // product pages already have their own sticky Add-to-Cart bar on mobile
  return { show: true, desktopOnly: path.startsWith("/p/") };
}

export function CartBar() {
  const { qty, subtotal, total, shipping, celebrate, setOpen } = useCart();
  const path = usePathname() ?? "/";

  const { show, desktopOnly: onProductPage } = cartBarState(path, qty);
  if (!show) return null;

  const away = SITE.freeShippingOver - subtotal;

  return (
    <>
      {/* keeps the footer clear of the fixed bar */}
      <div aria-hidden className={onProductPage ? "hidden h-[68px] lg:block" : "h-[68px]"} />

      <div
        className={`fixed inset-x-0 bottom-0 z-[75] border-t bg-ink text-white
                    shadow-[0_-8px_28px_rgba(20,16,14,0.22)] transition-colors duration-500
                    ${celebrate ? "border-leaf" : "border-white/10"}
                    ${onProductPage ? "hidden lg:block" : "block"}`}
      >
        <div className="wrap flex items-center gap-3 py-3">
          <button
            onClick={() => setOpen(true)}
            className="group flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label={`Review cart, ${qty} item${qty > 1 ? "s" : ""}, ${inr(total)}`}
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 7h12l-1.2 12.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8z" />
                <path d="M9 7V5.5a3 3 0 016 0V7" />
              </svg>
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[10px] font-bold leading-none text-white">
                {qty}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-tight tabular-nums">
                {inr(total)}
                {shipping === 0 && (
                  <span className="ml-2 text-[11px] font-normal text-[#8FCB9B]">Free delivery</span>
                )}
              </span>
              <span className={`block truncate text-[11.5px] ${
                celebrate ? "font-semibold text-[#8FCB9B]" : "text-[#A99C90] group-hover:text-white"}`}>
                {celebrate
                  ? "🎉 Free delivery unlocked!"
                  : away > 0
                    ? `Add ${inr(away)} more for free delivery`
                    : `${qty} item${qty > 1 ? "s" : ""} · tap to review`}
              </span>
            </span>
          </button>

          <Link
            href="/checkout"
            onClick={() => track("begin_checkout", { value: total, currency: "INR", source: "cart_bar" })}
            className="btn-amber shrink-0 px-6 py-3.5"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </>
  );
}
