/**
 * Brand assets (logo, favicon, social card) are stored base64-encoded under
 * assets/brand/ and decoded into place before every build.
 *
 * Why not commit the PNGs directly? They are produced and committed through a
 * text-only API surface, so raw binaries get mangled in transit. Keeping a
 * text source of truth makes the repo tamper-evident and diffable, and the
 * decode is dependency-free and deterministic.
 *
 * Runs automatically via the `prebuild` / `predev` npm hooks.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = join(root, "assets", "brand");
const manifest = JSON.parse(readFileSync(join(brandDir, "manifest.json"), "utf8"));

let written = 0;
for (const [target, source] of Object.entries(manifest)) {
  const src = join(brandDir, source);
  if (!existsSync(src)) {
    console.error(`[brand] missing source ${source} for ${target}`);
    process.exitCode = 1;
    continue;
  }
  const bytes = Buffer.from(readFileSync(src, "utf8").replace(/\s+/g, ""), "base64");
  if (bytes.length === 0) {
    console.error(`[brand] ${source} decoded to 0 bytes`);
    process.exitCode = 1;
    continue;
  }
  const out = join(root, target);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, bytes);
  written++;
}
console.log(`[brand] wrote ${written} asset(s)`);
