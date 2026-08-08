import Image from "next/image";

/* The real House of Charly wordmark, trimmed to its ink bounds with a
   transparent background. Two tones: `dark` for the cream header, `light`
   for the espresso footer. Never re-typeset the brand name in CSS. */
export function Logo({
  tone = "dark",
  height = 34,
  full = false,
  priority = false,
  className = ""
}: {
  tone?: "dark" | "light";
  height?: number;
  /** include the "The Choice of Every Home" tagline lockup */
  full?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const file = full
    ? tone === "light" ? "/logo-charly-full-light.png" : "/logo-charly-full.png"
    : tone === "light" ? "/logo-charly-light.png" : "/logo-charly.png";

  // intrinsic ratios of the trimmed artwork
  const ratio = full ? 734 / 320 : 585 / 200;

  return (
    <Image
      src={file}
      alt="House of Charly"
      width={Math.round(height * ratio)}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
