"use client";
import { useCart } from "@/context/CartContext";

/**
 * Transient "added to cart" confirmation.
 *
 * Stays mounted so it can animate both ways, but when there is no message it is
 * `invisible` — not merely translated away. Relying on a transform alone left
 * the dark pill (and its green tick) sitting on top of the sticky cart bar,
 * which read as a rendering glitch.
 */
export function Toast() {
  const { toast, qty } = useCart();
  const shown = Boolean(toast);
  // clear the sticky cart bar once it appears
  const lift = qty > 0 ? "bottom-[88px]" : "bottom-6";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!shown}
      className={`pointer-events-none fixed ${lift} left-1/2 z-[200] flex max-w-[calc(100%-2rem)]
                  -translate-x-1/2 items-center gap-2.5 rounded-[3px] bg-ink px-5 py-3.5
                  text-[13.5px] text-white shadow-2xl transition-all duration-300
                  ${shown ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6BD08C" strokeWidth="2.2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{toast}</span>
    </div>
  );
}
