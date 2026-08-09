"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { SITE } from "@/lib/site";
import { inr } from "@/lib/format";

/* Brand palette — warm confetti, no primary-colour party clichés. */
const COLOURS = ["#B4741F", "#C98A34", "#3F7A4B", "#FAF7F2", "#9E3B2C", "#E4DACB"];
const PIECES = 26;

/**
 * Free-delivery celebration: a short confetti burst plus a badge, fired once
 * when the basket crosses the threshold. Hand-rolled rather than pulling in a
 * confetti library — it's ~30 absolutely-positioned divs and costs nothing.
 *
 * Renders nothing at all for users who ask for reduced motion; they still get
 * the badge, just without the moving parts.
 */
export function Celebration() {
  const { celebrate } = useCart();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  // regenerate the scatter each time so two bursts never look identical
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        duration: 1.5 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() - 0.5) * 720,
        size: 6 + Math.random() * 6,
        colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
        round: Math.random() > 0.6
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebrate]
  );

  if (!celebrate) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[190] overflow-hidden">
      {!reduced &&
        pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              background: p.colour,
              borderRadius: p.round ? "50%" : 1,
              // @ts-expect-error custom properties are fine here
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
              animation: `confetti ${p.duration}s cubic-bezier(.25,.65,.4,1) ${p.delay}s forwards`
            }}
          />
        ))}

      <div
        role="status"
        className="absolute bottom-[92px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full
                   bg-leaf px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(20,16,14,.28)]"
        style={{ animation: reduced ? undefined : "popIn .45s cubic-bezier(.2,1.4,.4,1) both" }}
      >
        🎉 Free delivery unlocked on orders over {inr(SITE.freeShippingOver)}
      </div>
    </div>
  );
}
