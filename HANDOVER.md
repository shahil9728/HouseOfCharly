# House of Charly — Handover

**Date:** 13 August 2026
**Live site:** https://houseofcharly.netlify.app
**Repo:** https://github.com/shahil9728/HouseOfCharly (`main`, HEAD `648975c`)
**Sheet:** [Inventory + Catalog](https://docs.google.com/spreadsheets/d/1HvYsBJ8TpL_JuWAs59lYpTWJHQjE9VM7IjLXq6Nte-M/edit)

> This is the project summary and the outstanding-work list. For how the code
> works day to day, read `README.md`. This file is about *what was decided, why,
> and what still needs doing.*

---

## 1. What this replaced

The old site was a single-page Vite SPA on GitHub Pages: **2 hard-coded products**
(Premium Cashews, California Almonds), no cart, no routes, no server rendering,
and therefore effectively invisible to Google. It also carried unverifiable
social proof ("120k+ happy families", "4.9/5") which was dropped rather than
reproduced.

What exists now: a Next.js storefront serving **129 products / 75 product
cards**, driven entirely from your Google Sheet, with a cart, Razorpay + Cash on
Delivery checkout, and 140 URLs in the sitemap.

---

## 2. The architecture decision that matters

Your sheet was a **Vyapar accounting export** — `HSN`, `Purchase price`,
`Tax Rate`, `Base Unit`. It had nowhere to put a description or a photo, and
rewriting it would have broken re-import into your billing software.

So the sheet has **two tabs and the site joins them**:

```
Google Sheet
├── Sheet1   (gid 0)          ← your accounting export. UNTOUCHED.
└── Catalog  (gid 847778856)  ← added: descriptions, photos, SEO, flags
                │  joined on item_code, server-side, every 5 minutes
                ▼
        Next.js on Netlify
```

Edit either tab, wait ~5 minutes, the site updates. No deploy, no code change.
This is why you can run the shop from a spreadsheet without the spreadsheet
becoming a website-shaped mess.

**Stack:** Next.js 15.5.23 (App Router) · TypeScript · Tailwind · Netlify ·
Razorpay · localStorage cart. 147 pages build; product and category pages are
server-rendered for SEO.

---

## 3. 🔴 Do these — they are costing you money or orders

### 3.1 Set `ORDERS_WEBHOOK_URL` (highest priority)

**Right now, a Cash-on-Delivery order exists only in Netlify's server logs.**
If you take a COD order today and don't notice it, it is effectively lost.
Razorpay-paid orders are recoverable from the Razorpay dashboard; COD ones are not.

Fix (about 3 minutes, free forever):
1. Sheet → **Extensions → Apps Script**
2. Paste all of `docs/orders-apps-script.js`, change `NOTIFY_EMAIL` to your address
3. **Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: **Anyone*** → copy the `/exec` URL
4. Netlify → Environment variables → `ORDERS_WEBHOOK_URL` = that URL
5. **Deploys → Trigger deploy → Clear cache and deploy site**

You then get an "Orders" tab plus an email per order.

### 3.2 Add the Razorpay keys

Online payment is built and tested but **dormant** — checkout currently shows
Cash on Delivery only, because the keys aren't set. That's deliberate: a missing
variable degrades instead of breaking.

From Razorpay Dashboard → **Account & Settings → API Keys**:

| Netlify variable | Value |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_…` then `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | shown once — save it |

⚠️ **Never** paste the secret into chat, a file, or a `NEXT_PUBLIC_` variable. It
signs your payments; anyone holding it can forge them.

Start with **Test mode** keys and Razorpay's test cards, then switch to Live
after KYC (PAN, bank account, business proof — 1–2 days on their side).

**Cost:** ₹0 setup, ₹0 annual. **2% + 18% GST ≈ 2.36% per transaction.** On a
₹1,036 order that's ~₹24. COD stays free. Verified on razorpay.com/pricing.

### 3.3 Move the product images off my review host

All 51 live product photos and the 4 hero images are served from
`pub.hyperagent.com` — a host I used to prototype. **Do not run the business on
it long-term.** Move the files to Cloudflare R2, S3, or even a public Google
Drive folder (₹0–200/month at your volume), then update `image_1…4` in the
Catalog tab. Add the new host to `images.remotePatterns` in `next.config.mjs`.

---

## 4. 🟠 Data problems in the sheet (only you can fix these)

Checked against the live sheet on 13 Aug. The code reports these at build time.

| Product | Problem | Effect |
|---|---|---|
| `Kaju W-240 250G / 350G / 450G` | no `Sale price` | hidden from the shop |
| `Kaju W-240 1KG` | no price **and no item code** | hidden; can't have a URL |
| `Chia Seeds 70g` | name collides with another row | URL forced to `/p/chia-seeds-70g-chia70g2601` |

At the W-240 rate of ₹1.28/g the missing prices would be roughly **₹320 / ₹448 /
₹576 / ₹1,280**.

### 4.1 Seven products are missing from the Catalog tab

You added rows to Sheet1 but not to `Catalog`, so these have **no description and
no photo**:

`Chia Seeds 70g` · `Dhaniya-P 250g` · `Haldi-P 100g` · `Lal Mirch-P 250g` ·
`Saunf 250g` · `Teja Lal Mirch-P 250g` · `Tutti Fruiti - 250g`

**Whenever you add a product to Sheet1, add a row to `Catalog` with the same
`item_code`.** Only `item_code` is mandatory; everything else is optional.

### 4.2 Photo coverage dropped from 57 to 51

Six products lost their photos because their **`item_code` changed in Sheet1**
and no longer matches the `Catalog` tab. The join is on `item_code` — if you
edit a code, update it in both tabs or the photo and description silently vanish.

### 4.3 Still unresolved from earlier

- **Basil seeds 70g at ₹270 (₹3.86/g)** — the most expensive dry fruit per gram
  in your catalogue, dearer than Mamra almonds. Your other seeds run
  ₹0.50–0.82/g. Probably a typo; I didn't change it because it's your pricing.
- **Hing: ₹32 with a ₹30 discount** → customers pay **₹2**. That's 94% off and
  it is live.
- **`Almonds` and `Almonds "A"` are priced identically** (500g = ₹510 for both).
  Either they're the same product listed twice, or the grades should differ.

---

## 5. What was built

### Storefront
- Home with a 4-slide hero (cinematic food photography), category tiles,
  best-sellers, offers, brand story, FAQ
- Shop + category pages with filters (category, in stock, on offer, max price)
  and sort; **server-rendered**
- Product pages: gallery with zoom, pack-size selector, stock state, specs,
  shipping/returns accordions, related products
- Cart drawer, sticky basket bar, checkout, order-confirmation page
- About, Contact, FAQ, Shipping, Returns, Privacy, Terms, 404

### Commerce
- Cart in `localStorage`; quantities clamped to live stock
- **Razorpay** (UPI, cards, net banking, wallets) + **Cash on Delivery**
- Free delivery over ₹999, else ₹79 — with a confetti celebration when the
  basket crosses the threshold
- Order references like `HOC-N9ODJGNF6P6V`, crypto-random and avoiding
  I/O/0/1 so they survive being read aloud

### SEO
- Per-product titles, meta descriptions, canonicals, Open Graph
- Product / Organization / Breadcrumb / FAQ JSON-LD
- `sitemap.xml` (140 URLs), `robots.txt`, real 404s

### Brand
- Your actual logo, cropped from 1600×1600 (80% white margin) to its ink bounds
  with true transparency; cream variant for the dark footer
- Favicon: the "C" monogram, isolated via connected-component analysis to drop
  the overlapping "House of" script flourish. Legible at 16px
- Apple touch icon, multi-size `.ico`, 1200×630 social card
- 19 brand photos optimised from ~2MB PNGs to ~130KB progressive JPEGs (**15×**)

### Analytics — live and verified
GA4 `G-7W1PWNDTSK` and Meta Pixel `1541880543765241` are both firing.
All events route through one `track()` function: `page_view`, `view_item`,
`search`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`,
`whatsapp_order`, `purchase`, `hero_slide_click`.

**Still to do:** add `houseofcharly.com` to Google Search Console and submit
`https://houseofcharly.com/sitemap.xml`.

---

## 6. Decisions you should know about

**Pricing is `Sale price − Sale Discount`.** Originally I had it backwards and
every discounted item was overcharged — Kaju W-320 500g billed ₹600 instead of
₹490. Now the sheet's `Sale price` is the struck-through list price. A discount
≥ the list price is ignored and reported rather than selling at zero.

**No health claims anywhere.** All 129 product descriptions were written and then
machine-checked against a banned-terms list (immunity, weight loss, omega-3,
antioxidant, protein…). This is an FSSAI compliance matter, not style. In
particular "Weight-Loss Diet 500g" and "Diet W-Gain" are described only as
*"a curated daily mix of dry fruits and seeds"*.

**Hero images are AI-generated ingredients, not packaging.** AI reliably garbles
small text, so a regenerated Charly pouch would have shown a mangled logo. Loose
cashews and spices have no text to get wrong. Your real packshots stay on the
product cards and pages, where the packaging *is* the product.

**Adding to cart no longer opens the drawer.** It interrupted anyone building a
multi-item basket. Feedback is a toast plus a badge pulse; cards show a quantity
stepper once an item is in.

**One card per product family.** 129 SKUs render as 75 cards; six Kaju W-320
weights became one card reading "6 pack sizes · from ₹120". Grade and powder
markers survive, so `Almonds "A"`, `Almonds "B"` and `Saunf - P` stay distinct.

**WhatsApp was deliberately de-emphasised** and auto-send was not built. It needs
the Cloud API: a separate phone number, Meta business verification, template
approval, ~₹0.115/message — and crucially it *loses* the customer conversation
thread, because messaging them first is itself a paid template.

---

## 7. Bugs found and fixed along the way

Worth recording, because most were caught by testing rather than by looking:

| Bug | Consequence had it shipped |
|---|---|
| Prices charged list price, ignoring the discount | Every discounted item overcharged |
| `/shop` and category pages rendered **0 products** server-side | Google saw empty category pages |
| `useSearchParams()` on a static page | Root cause of the above — documented in README so it isn't reintroduced |
| Next.js 15.1.6 hit CVE-2025-55182 | Netlify refused to deploy at all |
| `SHEET_ID` unset → 9 pages instead of 129 | Site showed "restocking the shelves" |
| Duplicate product slugs | Build failure; now auto-suffixed and reported |
| Order refs only 2 random chars | Collisions; now 32⁷ |
| `add_to_cart` reported requested, not clamped, quantity | Corrupted conversion data |
| Idle toast overlaying the cart bar | Stray green tick; intercepted clicks |
| `visibilitychange` listener re-registered per home visit | Slow memory leak in the SPA |
| Binaries pushed via the GitHub API arrived as base64 text | All 10 brand images corrupt — hence the `assets/brand/*.b64` + `npm run brand` pipeline |

Every change was verified before pushing: **43** storefront-logic checks, **27**
data-layer checks against the live sheet, **23** checkout-security checks, **22**
cart-behaviour checks, **14** product-grouping checks, plus a real `next build`
and live HTTP tests.

---

## 8. Environment variables

| Variable | Set? | Notes |
|---|---|---|
| `SHEET_ID` | ✅ | Also has a code fallback so a missing value can't empty the store |
| `SHEET_GID_CATALOG` | ✅ `847778856` | Without it: no photos, no descriptions |
| `NEXT_PUBLIC_GA_ID` | ✅ | `G-7W1PWNDTSK` |
| `NEXT_PUBLIC_META_PIXEL_ID` | ✅ | `1541880543765241` |
| `ORDERS_WEBHOOK_URL` | ❌ | **Do this first** — see §3.1 |
| `RAZORPAY_KEY_ID` | ❌ | See §3.2 |
| `RAZORPAY_KEY_SECRET` | ❌ | Server-only. Never `NEXT_PUBLIC_` |
| `SHEET_CATALOG_URL` | — | Leave blank. Overrides the Catalog tab if set |

> After changing any variable, use **Clear cache and deploy site** — not a plain
> redeploy. Next.js caches fetch responses between builds and will happily serve
> the previous catalogue.

---

## 9. Working with this day to day

**Change a price, stock level, photo or description** → edit the Sheet, wait ~5
minutes. Nothing else.

**Add a product** → add to `Sheet1` *and* add a `Catalog` row with the same
`item_code`.

**Hide a product without deleting it** → `publish = FALSE` in `Catalog`.

**Change the logo** → replace the matching file in `assets/brand/*.b64`.

**Deploys take 2–4 minutes** after a push. If a change doesn't appear, wait, then
hard-refresh (Ctrl+Shift+R). Twice in this project a change looked broken when it
simply hadn't finished deploying.

---

## 10. Suggested order of work

1. `ORDERS_WEBHOOK_URL` — stop losing COD orders (§3.1)
2. Fix the 4 unpriced Kaju W-240 rows and the Chia name clash (§4)
3. Add the 7 missing `Catalog` rows; re-check the 6 codes that lost photos (§4.1–4.2)
4. Confirm the Basil seeds and Hing prices (§4.3)
5. Razorpay test keys → run a test payment → go live (§3.2)
6. Google Search Console + submit the sitemap (§5)
7. Migrate images to your own hosting (§3.3)
8. Photograph the remaining products — **51 of 129 have a photo**; the rest show a
   branded placeholder tile that looks deliberate, but photos convert better
9. Point `houseofcharly.com` at Netlify (currently on the old GitHub Pages site)
