# House of Charly — Storefront

Production storefront for [houseofcharly.com](https://houseofcharly.com). Next.js App Router,
Google Sheets as the product database, WhatsApp checkout.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in SHEET_ID etc.
npm run dev                    # http://localhost:3000
```

## Deploying to Netlify

1. **New site → Import from Git →** pick this repo.
2. Netlify auto-detects Next.js. `netlify.toml` already sets the build command,
   publish directory and the `@netlify/plugin-nextjs` runtime — don't override them.
3. Add the environment variables from `.env.example` under
   **Site settings → Environment variables**. At minimum `SHEET_ID`.
4. Deploy. Then **Domain settings → Add custom domain →** `houseofcharly.com`.

> The current site is served from GitHub Pages, which is static-only and cannot
> render product pages on the server. Moving to Netlify is what makes the SEO work.

---

## How product data flows

```
Google Sheet
 ├── Tab 1  "inventory"  ← your Vyapar accounting export. Never restructured.
 └── Tab 2  "Catalog"    ← additive: descriptions, images, SEO, flags
                │
                │  joined on item_code, server-side, every REVALIDATE_SECONDS
                ▼
        src/lib/sheet.ts  →  normalised Product[]
                ▼
        Pages (ISR) → Cart (localStorage) → Checkout → WhatsApp
```

**Why two tabs.** Tab 1 is an accounting export with columns like `HSN`,
`Purchase price` and `Tax Rate`. It has nowhere to put a description or an image,
and rewriting it would break the re-import into your billing software. Tab 2 adds
only what the website needs and is keyed on `item_code`. Edit either one and the
site picks it up on the next revalidation — no deploy, no code change.

### Tab 2 (`Catalog`) columns

| Column | Purpose |
|---|---|
| `item_code` | **Required.** Must match `Item code` in tab 1. |
| `slug` | URL segment. Auto-derived from the name if blank. |
| `display_name` | Overrides the accounting name on the website. |
| `short_description` | One line, shown on product cards. |
| `long_description` | Two paragraphs, separated by a blank line. |
| `image_1` … `image_4` | Full `https://` image URLs. |
| `featured`, `bestseller` | `TRUE` / blank. |
| `sort_order` | Lower sorts first. |
| `seo_title`, `seo_description` | Per-product meta tags. |
| `publish` | `FALSE` hides a product without deleting the row. |

Point `SHEET_GID_CATALOG` at that tab's `gid` once you create it. Until then the
site runs on tab 1 alone and simply shows no descriptions or photos.

### Data rules the code enforces

- A row with **no `Sale price`** is hidden from the storefront rather than sold at ₹0.
- **`Sale Discount` is treated as rupees off**, so the struck-through MRP is
  `price + discount`. If it is meant to be a percentage, change `mrp` in
  `src/lib/sheet.ts` — it is a one-line edit.
- **Zero stock** disables Add to Cart. Quantities are clamped to available stock.
- **Duplicate slugs** get the SKU appended so the build cannot break, and the
  clash is reported as a data issue.
- Sheet unreachable → the homepage shows a friendly "restocking" message instead
  of a stack trace.

---

## Project layout

```
src/
  app/
    page.tsx              home (hero slideshow, categories, bestsellers, offers)
    shop/                 all products, filters + sort
    c/[category]/         category listing
    p/[slug]/             product detail (+ Product JSON-LD)
    checkout/             customer details → WhatsApp order
    about contact faq shipping returns privacy terms
    sitemap.ts robots.ts not-found.tsx
  components/             Header, Hero, ProductCard, CartDrawer, CheckoutForm, …
  context/CartContext     cart state, localStorage, stock clamping
  lib/
    sheet.ts              Sheets fetch + normalise + validate   ← the important one
    whatsapp.ts           order message builder
    analytics.ts          single track() choke point
    site.ts               phone, email, shipping thresholds
    slides.ts             hero slideshow content
```

## Analytics

Every event goes through `track()` in `src/lib/analytics.ts`, which fans out to
GA4 and Meta Pixel. Set `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_META_PIXEL_ID` and
events start flowing; leave them blank and no tracking scripts load at all.

Events emitted: `page_view`, `view_item`, `search`, `add_to_cart`,
`remove_from_cart`, `view_cart`, `begin_checkout`, `whatsapp_order`,
`hero_slide_click`.

`add_to_cart` reports the quantity **actually** added after stock clamping, not
the quantity requested — otherwise conversion data drifts.

## Payments later

Checkout collects the customer and builds a WhatsApp message; it does not take
payment. To add a gateway, replace the submit handler in
`src/components/CheckoutForm.tsx` — the cart, totals and shipping rules stay as
they are.

## Images

Product images are referenced by URL from the sheet. Any host works as long as
it is added to `images.remotePatterns` in `next.config.mjs`.

> ⚠️ The current URLs point at a review CDN (`pub.hyperagent.com`) used to
> prototype this site. **Move these files to your own hosting before launch** and
> update the sheet — do not run a live business off that host.

## Known data issues

Run the app and check the server logs, or read `issues` from `getCatalog()`.
As of the last check the sheet had 7 errors and 4 warnings — chiefly `Kaju W-240`
rows with no price, a duplicate `AL-A500G2601` item code, an `Almonds 1kg` name
collision, and several seed packs where a larger pack is cheaper than a smaller one.
