"use client";
import Image from "next/image";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

/** Image that degrades to the branded tile if the Sheet URL is dead. */
export function ProductImage({
  src, alt, name, sub, priority = false, sizes = "(max-width:780px) 50vw, 25vw"
}: {
  src?: string; alt: string; name: string; sub?: string | null; priority?: boolean; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Placeholder name={name} sub={sub} />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
    />
  );
}
