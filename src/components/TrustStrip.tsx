const ITEMS = [
  ["M11 20A7 7 0 019 6c3-2 6-2 10-2 0 4 0 7-2 10a7 7 0 01-6 6z M5 21c2-6 5-9 9-11", "Sourced in Jammu", "Handpicked from trusted farms"],
  ["M12 3s6 6.4 6 10.5A6 6 0 016 13.5C6 9.4 12 3 12 3z", "100% Natural", "No additives, no colouring"],
  ["M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8", "Freshly Packed", "Sealed in small batches"],
  ["M12 4a6 6 0 100 12 6 6 0 000-12z M9 15.5V22l3-1.6 3 1.6v-6.5", "Our Own Label", "Packed under the Charly name"]
] as const;

export function TrustStrip() {
  return (
    <div className="border-y border-line bg-cream-2">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {ITEMS.map(([d, title, sub]) => (
            <div key={title} className="flex flex-col items-center gap-2.5 bg-cream-2 px-4 py-6 text-center md:px-5 md:py-8">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
                {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
              </svg>
              <div className="font-display text-[20px] leading-tight">{title}</div>
              <div className="max-w-[22ch] text-[11.5px] leading-snug text-muted">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
