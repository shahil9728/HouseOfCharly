"use client";
import { useCart } from "@/context/CartContext";

export function Toast() {
  const { toast, qty } = useCart();
  // Sit above the sticky cart bar once it appears, rather than on top of it.
  const lift = qty > 0 ? "bottom-[86px]" : "bottom-6";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed ${lift} left-1/2 z-[200] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center
                  gap-2.5 rounded-[3px] bg-ink px-5 py-3.5 text-[13.5px] text-white shadow-2xl
                  transition-[transform,bottom] duration-300 ${toast ? "translate-y-0" : "translate-y-[200%]"}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6BD08C" strokeWidth="2.2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{toast}</span>
    </div>
  );
}
