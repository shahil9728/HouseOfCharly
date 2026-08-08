"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export interface Slide {
  img: string; alt: string; eyebrow: string;
  title: string; titleEm: string; lede: string; cta: string; href: string;
}

const DURATION = 6000;

export function Hero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on(); m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const vis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), DURATION);
    return () => clearInterval(t);
  }, [paused, reduced, slides.length, i]);

  const go = useCallback((n: number, manual = false) => {
    const next = (n % slides.length + slides.length) % slides.length;
    setI(next);
    if (manual) track("hero_slide_click", { slide: next, label: slides[next].cta });
  }, [slides]);

  const s = slides[i];

  return (
    <section aria-roledescription="carousel" aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1), true);
        touchX.current = null;
      }}
      className="relative flex min-h-[520px] items-center overflow-hidden bg-ink text-white lg:min-h-[min(86vh,760px)]">

      <div className="absolute inset-0 z-0">
        {slides.map((sl, j) => (
          <div key={sl.img} role="group" aria-roledescription="slide"
            aria-label={`${j + 1} of ${slides.length}`} aria-hidden={j !== i}
            className={`absolute inset-0 transition-opacity duration-1000 ${j === i ? "opacity-100" : "opacity-0"}`}>
            <Image src={sl.img} alt={sl.alt} fill priority={j === 0} sizes="100vw"
              className={`object-cover transition-transform ease-linear ${j === i ? "scale-100 duration-[7500ms]" : "scale-[1.06] duration-0"}`} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1]
        bg-[linear-gradient(180deg,rgba(16,12,10,.62)_0%,rgba(16,12,10,.78)_55%,rgba(16,12,10,.94)_100%)]
        lg:bg-[linear-gradient(90deg,rgba(16,12,10,.94)_0%,rgba(16,12,10,.82)_34%,rgba(16,12,10,.34)_62%,rgba(16,12,10,.12)_100%)]" />

      <div className="relative z-[2] w-full py-16 lg:py-24">
        <div className="wrap">
          <div className="max-w-[640px]">
            <div key={`t-${i}`} className="animate-[fadeUp_.5s_ease]">
              <div className="eyebrow">{s.eyebrow}</div>
              <h1 className="mt-4 text-[clamp(44px,6.2vw,84px)] leading-[1.03] text-white [text-shadow:0_2px_30px_rgba(0,0,0,.4)]">
                {s.title}<br /><em className="italic text-amber-light">{s.titleEm}</em>
              </h1>
              <p className="mt-5 max-w-[44ch] text-[16.5px] text-[#D6CCC0]">{s.lede}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={s.href} className="btn-amber">{s.cta}</Link>
                <Link href="/about" className="btn-light">Our Story</Link>
              </div>
            </div>

            <div className="mt-11 flex items-center gap-4 border-t border-white/15 pt-6">
              <div className="flex gap-2" role="tablist" aria-label="Choose slide">
                {slides.map((sl, j) => (
                  <button key={sl.img} role="tab" aria-selected={j === i} aria-label={sl.eyebrow}
                    onClick={() => go(j, true)}
                    className={`relative h-[3px] w-[34px] overflow-hidden rounded-sm transition-colors
                      ${j === i ? "bg-white/30" : "bg-white/25 hover:bg-white/50"}`}>
                    {j === i && !reduced && (
                      <span key={`p-${i}-${paused}`}
                        className="absolute inset-0 origin-left bg-amber-light"
                        style={{ animation: `fill ${DURATION}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />
                    )}
                    {j === i && reduced && <span className="absolute inset-0 bg-amber-light" />}
                  </button>
                ))}
              </div>
              <span className="text-[10.5px] uppercase tracking-[0.2em] text-[#9B8E82] tabular-nums">
                {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
              <div className="ml-auto hidden gap-2 lg:flex">
                <Arrow dir="prev" onClick={() => go(i - 1, true)} />
                <Arrow dir="next" onClick={() => go(i + 1, true)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
      className="grid h-[42px] w-[42px] place-items-center rounded-sm border border-white/30 text-white transition hover:border-white hover:bg-white hover:text-ink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
