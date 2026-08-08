/* Branded fallback tile for products with no photography yet.
   Never render a broken-image icon on a premium storefront. */
export function Placeholder({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="relative grid h-full w-full place-items-center bg-[radial-gradient(120%_90%_at_50%_0%,#fff_0%,#F2ECE3_70%,#E9DFD0_100%)] text-center">
      <div className="pointer-events-none absolute inset-3.5 border border-amber/20" />
      <div>
        <div className="font-display text-[34px] leading-none text-ink">
          {(name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="mt-2 text-[9.5px] uppercase tracking-[0.2em] text-amber">House of Charly</div>
        {sub ? <div className="mt-1 text-[10px] tracking-wide text-faint">{sub}</div> : null}
      </div>
    </div>
  );
}
