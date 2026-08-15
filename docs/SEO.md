# SEO — what was done, and what only you can do

**Live site:** https://houseofcharly.com (canonical host)
**Old host:** https://houseofcharly.netlify.app — now 301-redirects to the real domain

This file has two halves. Section 1 is what the code now does, so a future
developer doesn't undo it by accident. Section 2 is the list of things that
cannot be done from the repo — they need your Google account, your Netlify
dashboard or your Google Sheet.

---

## 1. What the code now does

### The domain move

The biggest problem was not a missing tag: **both hosts served the whole site
with a 200**. Google could index every page twice — once as
`houseofcharly.netlify.app`, once as `houseofcharly.com` — and split the ranking
between the two. `netlify.toml` now 301-redirects the netlify.app host to the
real domain, so every link and every bit of ranking history consolidates on one
place. Deploy previews (`deploy-preview-*--houseofcharly.netlify.app`) are
unaffected.

### Structured data

Everything now lives in `src/lib/seo.tsx`, so the business is described the same
way on every page. Previously the organisation schema sat inline in the layout
and the product schema inline in the product page, and the two could drift — a
shipping cost in schema that disagrees with the shipping page is worse than no
schema at all, because Google reads it as a misrepresentation.

| Node | Where | What it earns |
|---|---|---|
| `OnlineStore` (logo, address, phone, payments, `sameAs`) | every page | Brand knowledge panel, logo in results |
| `WebSite` + `SearchAction` | every page | Sitelinks searchbox |
| `ProductGroup` + `hasVariant` | products with several pack sizes | **One** result with a price range instead of six competing results |
| `Product` + `Offer` | single-size products | Price, stock and currency in the result |
| `MerchantReturnPolicy`, `OfferShippingDetails` | every offer | The "free delivery" and "free returns" annotations on shopping results |
| `CollectionPage` + `ItemList` + `AggregateOffer` | `/shop`, `/c/*` | Category-level rich results |
| `FAQPage` | `/faq` | Expandable Q&A in results |
| `BreadcrumbList` | all inner pages | Breadcrumb trail instead of a raw URL |

Offers also carry `itemCondition`, `priceValidUntil` and `sku` — all required or
strongly recommended for a merchant listing. There is deliberately **no
`aggregateRating`**: you have no collected reviews, and inventing them is the
one structured-data offence that earns a manual penalty.

### Content depth

A category page whose only content is a grid of cards has nothing for Google to
match a query against, which is why small shops lose these queries to
marketplaces. `/c/dry-fruit` and `/c/spices` now carry a real buying guide —
cashew grades, kernel vs. in-shell walnut pricing, storage in Indian humidity,
whole vs. ground spice. It sits *below* the grid, so it informs without pushing
products off the screen.

The FAQ set was also **factually wrong** and being published as structured data:
it said orders are placed over WhatsApp and that "online card payment will be
added later", when the site has had a working checkout with Cash on Delivery and
Razorpay all along. Those answers are now correct, and five new ones cover the
queries people actually type — COD, delivery time, nationwide delivery, GST,
storage.

### Titles and descriptions

Titles now lead with the phrase a stranger would search, not with the brand —
nobody searches a brand they have not heard of yet:

- Home: `Buy Dry Fruits & Spices Online — Sourced from Jammu | House of Charly`
- Dry fruits: `Buy Dry Fruits Online — Cashews, Walnuts, Raisins & Seeds`
- Spices: `Buy Whole Spices & Masala Powders Online — Ground in Small Batches`

Product pages prefer the sheet's `seo_title` / `seo_description` when set. When
they are blank, the fallback is now built from real facts — price, weight,
category, free-delivery threshold — instead of a bare "Buy X".

### Crawling and indexing

- **Sitemap** stopped lying. It used to stamp all 140 URLs with `new Date()`, so
  everything claimed to change the moment the file was fetched; Google learns to
  distrust that and then ignores `lastmod` site-wide. Product and category URLs
  now carry the catalogue's real fetch time, policy pages carry a fixed content
  date. Product entries also declare their photography, which is what gets a
  product into Google Images.
- **Sold-out products stay in the sitemap**, at lower priority, with
  `OutOfStock` in schema. De-listing them would discard ranking you already own.
- **robots.txt** now blocks the infinite URL space: `?filter=`, `?sort=`, `?q=`
  and `/search`. Googlebot-Image and Storebot-Google are named explicitly so a
  future tightening can't silently cut off Google Images and free Shopping.
- `/search` is a real server-rendered page now (`noindex, follow`) — needed
  before `SearchAction` can be honoured, and it means a shared search link works.
- `/cart` returns a permanent 308 to `/checkout` instead of a temporary redirect.
- 404s and missing products are explicitly `noindex`, so an item code changing in
  the sheet can't leave a soft 404 in the index.

### Speed (Core Web Vitals is a ranking input)

- `preconnect` to the image host — the largest image on the page previously
  waited on a fresh DNS lookup and TLS handshake before it could start.
- The first four product cards load eagerly; the rest stay lazy. The first row
  *is* the largest contentful paint on a category page.
- Immutable one-year caching on hashed build assets, 31-day caching on optimised
  images, via `netlify.toml` and `next.config.mjs`.
- HSTS, so returning visitors skip the http→https hop.

### Accessibility and semantics

`<html lang="en-IN">` (was `en`), a web manifest, `theme-color`, and product
image `alt` text that describes the photograph — name, weight, category — rather
than repeating the link next to it.

---

## 2. Your steps — in order

Nothing here needs code. Do them in this order; the first two matter most.

### Step 1 — Add the new domain to Google Search Console (15 minutes)

Google currently has no idea `houseofcharly.com` exists.

1. Go to https://search.google.com/search-console
2. Click **Add property** → choose **Domain** (the left box, *not* URL prefix).
   Domain covers `www`, non-`www` and `http`/`https` in one property.
3. Type `houseofcharly.com` and continue.
4. Google gives you a **TXT record**. Copy it.
5. Go to wherever you bought the domain (GoDaddy, Namecheap, Hostinger…) → **DNS
   settings** → **Add record**:
   - Type: `TXT`
   - Name / Host: `@`
   - Value: paste the Google string
6. Save, go back to Google, click **Verify**. If it fails, wait 30 minutes and
   press Verify again — DNS takes time to spread. This is normal.

> Prefer not to touch DNS? Choose **URL prefix** instead, pick the HTML tag
> method, and send me the `content="..."` value — the code already has a slot for
> it (`GOOGLE_SITE_VERIFICATION` in Netlify). DNS is the better option though:
> it survives a redesign.

### Step 2 — Submit the sitemap (2 minutes)

Once verified, inside Search Console:

1. Left menu → **Sitemaps**
2. In "Add a new sitemap", type: `sitemap.xml`
3. **Submit**

Status should read "Success" with about 140 discovered URLs. If it says
"Couldn't fetch", wait an hour and hit refresh — a fresh property sometimes needs
one.

### Step 3 — Ask Google to look at the important pages now (5 minutes)

Sitemaps get crawled on Google's schedule, which can be days. To jump the queue,
use the search bar at the top of Search Console ("Inspect any URL") for each of
these, then click **Request indexing**:

- `https://houseofcharly.com/`
- `https://houseofcharly.com/shop`
- `https://houseofcharly.com/c/dry-fruit`
- `https://houseofcharly.com/c/spices`
- `https://houseofcharly.com/faq`
- your three or four best-selling product pages

There is a daily limit of around ten, so spend them on your best pages. Don't
bother doing this for all 129 products — the sitemap handles those.

### Step 4 — Tell Netlify which domain is the real one (5 minutes)

1. Netlify → your site → **Domain management**
2. Confirm `houseofcharly.com` is listed and marked **Primary domain**
3. Check **Environment variables** for `NEXT_PUBLIC_SITE_URL`. If it exists, it
   must be exactly `https://houseofcharly.com` — no trailing slash. If it points
   at the netlify.app address, every canonical tag on the site is wrong. If it
   isn't there at all, that's fine; the code defaults to the right value.
4. **Deploys → Trigger deploy → Clear cache and deploy site** (not a plain
   redeploy — Next caches the catalogue between builds).

### Step 5 — Google Business Profile ✅ done

Your shop's real address — Shop No. 7, TCP2, Sainik Adarsh Enclave, Hisar,
Haryana 125006 — and Google Maps listing are now in the site's structured data
(`OnlineStore.address`, `geo`, `hasMap` in `src/lib/seo.tsx`), and the address is
printed and linked in the footer of every page. If the profile isn't live yet
on https://business.google.com, create one — it's what puts you in Google Maps
and the local pack for "dry fruits shop near me", which for a shop with a real
walk-in address is often more traffic than the whole website. Use the exact
same name ("House of Charly"), phone and address as the site — Google
cross-checks them, and a mismatch anywhere weakens all of them.

If the shop ever relocates, update `NEXT_PUBLIC_STREET_ADDRESS`,
`NEXT_PUBLIC_LOCALITY`, `NEXT_PUBLIC_REGION` and `NEXT_PUBLIC_POSTAL_CODE` in
Netlify — they override the hard-coded default in `src/lib/site.ts`.

### Step 6 — Social links ✅ Instagram done

`https://www.instagram.com/houseofcharly.in/` is now in the site's `sameAs`
schema and linked from the footer. If you add a Facebook or YouTube page, send
me the link, or add it yourself in Netlify → Environment variables:

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_FACEBOOK_URL` | `https://www.facebook.com/houseofcharly` |
| `NEXT_PUBLIC_YOUTUBE_URL` | (if you have one) |

Then clear-cache-and-deploy.

### Step 7 — Fill the gaps in the Sheet (ongoing, and this is the real work)

The website is now technically in good shape. What limits it from here is
content, and only you can supply it:

1. **Photograph the remaining products.** 51 of 129 have a photo. A product with
   no photo will not appear in Google Images, and Google Images is a genuine
   traffic source for food. This is the highest-value thing on this whole list.
2. **Fill `seo_title` and `seo_description` in the Catalog tab** for your top
   20 sellers. Write them the way a customer searches: *"Buy Kaju W-320 500g
   Online — ₹490 | House of Charly"*. The code has a sensible fallback, but a
   human-written one beats it every time.
3. **Add the 7 missing Catalog rows** (see `HANDOVER.md` §4.1). Those products
   currently have no description at all — nothing for Google to read.
4. **Fix the unpriced Kaju W-240 rows.** A product with no price is hidden from
   the shop entirely, so it can never rank.

### Step 8 — Check back in two weeks

In Search Console:

- **Pages** — how many are indexed. Expect this to climb from near-zero over
  2–4 weeks. A brand-new domain is always slow; this is not something being
  broken.
- **Performance** — which queries you appear for. Look for queries where you
  rank 8–20 and the page is nearly good enough; those are the cheapest wins.
- **Enhancements → Merchant listings / Products** — Google reports structured
  data problems here. It may ask for `gtin` or a review count; both are optional
  and neither should be faked.

---

## What I deliberately did not do

- **No fake reviews or ratings.** Star ratings in results need real collected
  reviews. Inventing them is the fastest route to a manual penalty.
- **No health claims.** Existing FSSAI-compliance work in the product copy was
  left alone — "immunity", "protein", "antioxidant" and similar remain banned,
  even though they would help you rank.
- **No keyword-stuffed copy.** The category guides are written to be read. Text
  written for a crawler reads like it, and visitors leave — which Google measures.
- **No blog.** It would help, but an abandoned blog with three posts from 2026
  hurts more than no blog. Worth doing only if you'll write monthly.
