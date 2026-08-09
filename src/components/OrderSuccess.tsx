"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { track } from "@/lib/analytics";

/**
 * Confirmation shown after a successful order. Reads the reference from the
 * query string and clears the cart exactly once — the cart must survive a
 * failed or abandoned payment, so it is only emptied here, on confirmed success.
 */
export function OrderSuccess() {
  const { clear } = useCart();
  const [ref, setRef] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const r = q.get("ref");
    const m = q.get("method");
    setRef(r);
    setMethod(m);
    clear();
    track("purchase_confirmed", { transaction_id: r ?? undefined, method: m ?? undefined });
    // clear() is stable enough here; re-running would wipe a fresh cart
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-soft">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3F7A4B" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-6 text-[clamp(32px,5vw,48px)]">Order placed successfully</h1>

      <p className="mx-auto mt-3 max-w-[46ch] text-[16px] text-muted">
        Thank you — we have received your order and will confirm it with you shortly.
      </p>

      {ref && (
        <div className="mx-auto mt-7 inline-flex flex-col items-center rounded-[3px] border border-line bg-white px-7 py-4">
          <span className="text-[10.5px] uppercase tracking-[0.2em] text-faint">Order reference</span>
          <span className="mt-1 font-display text-[26px] tracking-wide">{ref}</span>
        </div>
      )}

      <p className="mt-6 text-[13.5px] text-muted">
        {method === "cod"
          ? "Payment method: Cash on Delivery. Please keep the exact amount ready."
          : method === "razorpay"
            ? "Payment received. A receipt has been sent by Razorpay to your email or phone."
            : "We will be in touch to confirm delivery."}
      </p>
    </>
  );
}
