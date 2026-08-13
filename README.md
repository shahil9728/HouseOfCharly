# House of Charly — Storefront

Production storefront for [houseofcharly.com](https://houseofcharly.com). Next.js App Router,
Google Sheets as the product database, Razorpay + Cash on Delivery checkout.

> **SEO:** see [`docs/SEO.md`](docs/SEO.md) for what the code does and the
> owner's Search Console / Business Profile checklist.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in SHEET_ID etc.
npm run dev                    # http://localhost:3000
```

> `npm run brand` runs automatically before `dev` and `build`. It decodes the
> logo, favicon and social card from `assets/brand/*.b64` into `public/` and
> `src/app/`. Those outputs are gitignored — the base64 files are the source of
> truth. To change the logo, replace the matching `.b64` file.

## Deploying to Netlify

1. **New site → Import from Git →** pick this repo.
2. Netlify auto-detects Next.js. `netlify.toml` already sets the build command,
   publish directory and the `@netlify/plugin-nextjs` runtime — don't override them.
3. Add the environment variables from `.env.example` under
   **Site settings → Environment variables**. At minimum `SHEET_ID`.
4. Deploy. Then **Domain settings → Add custom domain →** `houseofcharly.com`.

> **Canonical host.** `houseofcharly.com` is the only host that should serve a
> 200. `netlify.toml` 301-redirects `houseofcharly.netlify.app` to it, because two
> hosts serving the same pages splits the ranking between them. Deploy previews
> (`deploy-preview-*--houseofcharly.netlify.app`) don't match the rule and keep
> working. If you add another domain, redirect it here too — don't serve from it.
>
> `NEXT_PUBLIC_SITE_URL`, if set, must be exactly `https://houseofcharly.com`
> with no trailing slash: it is the base for every canonical tag, every sitemap
> URL and every schema `@id`. Wrong value there quietly breaks all three.

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

### Why product photos are missing

If every product shows the branded placeholder tile, there is **no catalog
source configured**. Photos and descriptions live in tab 2, not in the
accounting export. Check the build log for:

```
[sheet] No catalog source configured — products will have NO photos
```

Fix it either way:

1. **Sheet tab (recommended).** File > Import > Upload the catalog CSV >
   "Insert new sheet(s)". Open the new tab and copy its `gid` from the URL
   (`...#gid=123456`). Set `SHEET_GID_CATALOG=123456`.
2. **Any CSV URL.** Set `SHEET_CATALOG_URL` to a publicly readable CSV. Useful
   before the tab exists; overrides `SHEET_GID_CATALOG` when both are set.

After changing either variable on Netlify, use **Clear cache and deploy site**.
Next.js caches fetch responses between builds, so a plain redeploy can serve
the previous (empty) catalogue.

### Data rules the code enforces

- A row with **no `Sale price`** is hidden from the storefront rather than sold at ₹0.
- **Pricing.** `Sale price` is the list price (shown struck through) and
  `Sale Discount` is rupees off. What the customer pays is
  **`Sale price − Sale Discount`**. A discount greater than or equal to the
  list price is ignored and reported, so nothing can sell at or below zero.
- **Zero stock** disables Add to Cart. Quantities are clamped to available stock.
- **Duplicate slugs** get the SKU appended so the build cannot break, and the
  clash is reported as a data issue.
- Sheet unreachable → the homepage shows a friendly "restocking" message instead
  of a stack trace.

> **Do not call `useSearchParams()` in the shop or category subtree.** On a
> statically generated page it opts the whole subtree out of server rendering,
> and the product grid silently disappears from the HTML crawlers see. Read
> `window.location.search` in an effect after mount instead.

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

## Analytics setup

Every event goes through `track()` in `src/lib/analytics.ts`, which fans out to
GA4 and Meta Pixel. Set `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_META_PIXEL_ID` and
events start flowing; leave them blank and no tracking scripts load at all.

Events emitted: `page_view`, `view_item`, `search`, `add_to_cart`,
`remove_from_cart`, `view_cart`, `begin_checkout`, `whatsapp_order`,
`hero_slide_click`.

`add_to_cart` reports the quantity **actually** added after stock clamping, not
the quantity requested — otherwise conversion data drifts.

## Payments

Two methods: **Razorpay** (UPI, cards, net banking, wallets) and **Cash on
Delivery**. Online payment only appears when both Razorpay keys are set —
without them checkout silently falls back to COD, so the site is never broken
by a missing variable.

| Variable | Where | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID` | server | Also sent to the browser to open checkout — public by design. |
| `RAZORPAY_KEY_SECRET` | server | **Never** prefix with `NEXT_PUBLIC_`. Signs and verifies payments. |
| `ORDERS_WEBHOOK_URL` | server | Any JSON POST endpoint. See `docs/orders-apps-script.js`. |

### The two rules this code exists to enforce

1. **The browser never sets the price.** `POST /api/checkout/create-order`
   receives only `{ sku, qty }`. Every price, the shipping rule and the total
   are recomputed in `priceOrder()` from the sheet. A tampered request asking to
   pay ₹1 for a ₹740 order is charged ₹740.
2. **Every payment is verified server-side.** Razorpay signs
   `order_id|payment_id` with the key secret; `/api/checkout/verify` recomputes
   that HMAC and compares it in constant time. A forged success POST is
   rejected with 400 and nothing is recorded.

### Flow

```
Checkout → /api/checkout/create-order   (server prices the cart, creates a Razorpay order)
         → Razorpay modal               (card/UPI handled entirely by Razorpay)
         → /api/checkout/verify         (HMAC check, then record the order)
         → /order/success               (clears the cart, shows the reference)

COD      → /api/checkout/cod            (server prices, records) → /order/success
```

The cart is cleared **only** on the success page, so an abandoned or failed
payment leaves the basket intact.

### Recording orders

Without `ORDERS_WEBHOOK_URL`, orders are written to the server log only. Paid
orders are still recoverable from the Razorpay dashboard, but **COD orders are
not recoverable** — set this before taking COD orders. `docs/orders-apps-script.js`
is a ready-to-deploy Google Apps Script that appends each order to an "Orders"
tab and emails you.

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


---

## Brand assets

| File | Use |
|---|---|
| `public/logo-charly.png` | Wordmark, dark ink — header |
| `public/logo-charly-light.png` | Wordmark, cream — dark footer |
| `public/logo-charly-full*.png` | Full lockup incl. tagline |
| `src/app/icon.png` | Browser tab favicon (512, auto-wired by Next) |
| `src/app/apple-icon.png` | iOS home-screen icon (180) |
| `public/favicon.ico` | Legacy .ico, 16/32/48/64 |
| `src/app/opengraph-image.png` | Social share card (1200x630) |

All are trimmed to the artwork bounds with transparent backgrounds, so the
wordmark never carries a white box. Render them through `<Logo />`, never by
re-typesetting the brand name in CSS.
