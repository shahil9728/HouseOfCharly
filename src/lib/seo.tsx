import { SITE } from "./site";
import type { Product } from "./types";

/* ---------------------------------------------------------------------------
 * Structured data.
 *
 * One module so every page emits the *same* facts about the business. When the
 * organisation appeared inline in the layout and the product schema inline in
 * the product page, the two could drift — and a shipping cost in schema that
 * disagrees with the shipping page is worse than no schema at all, because
 * Google treats it as a misrepresentation rather than a gap.
 *
 * Everything here is JSON-LD, which is Google's stated preference and the only
 * format that survives a component being moved.
 * ------------------------------------------------------------------------- */

const abs = (path: string) => `${SITE.url}${path}`;

/** Drops empty strings, nulls and empty arrays so no key is emitted blank. */
function compact<T extends Record<string, unknown>>(o: T): T {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) delete o[k];
  }
  return o;
}

const postalAddress = () =>
  compact({
    "@type": "PostalAddress",
    streetAddress: SITE.street,
    addressLocality: SITE.locality,
    addressRegion: SITE.region,
    postalCode: SITE.postalCode,
    addressCountry: SITE.country
  });

/**
 * The brand entity. `@id` is a stable identifier every other node points at,
 * so Google reads one organisation with many mentions rather than one
 * organisation per page.
 */
export function organizationSchema() {
  return compact({
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: "Charly",
    slogan: SITE.tagline,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: abs("/logo-charly.png"),
      caption: SITE.name
    },
    image: abs("/opengraph-image.png"),
    description:
      "House of Charly sells premium dry fruits, nuts, seeds and whole spices sourced from Jammu and delivered across India.",
    telephone: SITE.phoneRaw,
    email: SITE.email,
    address: postalAddress(),
    /* `geo` + `hasMap` are what let Google resolve this to the exact pin on the
       owner's Business Profile rather than inferring a rough location from the
       address text — the difference between showing up on Maps and not. */
    geo: SITE.geo
      ? { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng }
      : undefined,
    hasMap: SITE.googleMapsUrl || undefined,
    areaServed: { "@type": "Country", name: "India" },
    currenciesAccepted: "INR",
    paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery",
    priceRange: "₹₹",
    sameAs: SITE.social,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phoneRaw,
      email: SITE.email,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "hi"]
    }
  });
}

/**
 * The site entity plus its search endpoint. The SearchAction is what makes a
 * sitelinks searchbox possible in the result page — it needs a real, crawlable
 * URL that returns results, which is why /search exists as a server-rendered
 * route rather than only as the client-side overlay.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.tagline,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Delivery terms, expressed the way Google's merchant listing documentation
 * wants them. Two entries because the cost genuinely changes at a threshold —
 * flattening that to one number would misstate it for half of all baskets.
 */
function shippingDetails() {
  const deliveryTime = {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" }
  };
  const area = { "@type": "DefinedRegion", addressCountry: "IN" };

  return [
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
      shippingDestination: area,
      deliveryTime,
      /* Free over the threshold — stated as an eligible-transaction band so the
         zero rate is not read as "always free". */
      eligibleTransactionVolume: {
        "@type": "PriceSpecification",
        minPrice: SITE.freeShippingOver,
        priceCurrency: "INR"
      }
    },
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: SITE.shippingFlat, currency: "INR" },
      shippingDestination: area,
      deliveryTime,
      eligibleTransactionVolume: {
        "@type": "PriceSpecification",
        maxPrice: SITE.freeShippingOver - 1,
        priceCurrency: "INR"
      }
    }
  ];
}

/**
 * Return policy. Food is genuinely not returnable once opened, so this states
 * the real position — damaged or wrong items only, raised inside the window.
 * Claiming a 30-day no-questions return we don't honour would be the kind of
 * mismatch that gets structured data ignored site-wide.
 */
function returnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: SITE.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    merchantReturnLink: abs("/returns")
  };
}

/** ISO date ~90 days out. Merchant listings want an explicit price validity. */
function priceValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

function offerFor(p: Product) {
  return compact({
    "@type": "Offer",
    url: abs(`/p/${p.slug}`),
    price: p.price,
    priceCurrency: "INR",
    priceValidUntil: priceValidUntil(),
    itemCondition: "https://schema.org/NewCondition",
    availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    seller: { "@id": `${SITE.url}/#organization` },
    shippingDetails: shippingDetails(),
    hasMerchantReturnPolicy: returnPolicy()
  });
}

/** Splits "250g" / "1kg" into a schema weight. Skipped when unparseable. */
function weightOf(p: Product) {
  const m = (p.weight ?? "").match(/^([\d.]+)\s*(kg|g)$/i);
  if (!m) return undefined;
  return {
    "@type": "QuantitativeValue",
    value: Number(m[1]),
    unitCode: m[2].toLowerCase() === "kg" ? "KGM" : "GRM"
  };
}

/**
 * Product schema for a single pack size.
 *
 * `sku` is the sheet's item_code, which is the only stable identifier this
 * catalogue has — there are no GTINs, and inventing them would be fraud. Google
 * accepts sku alone for a merchant listing.
 */
export function productSchema(p: Product, siblings: Product[] = []) {
  const sizes = siblings.filter((s) => s.family === p.family);

  /* A family with several pack sizes is one product with variants, not six
     unrelated products. Declaring the group lets Google collapse them into a
     single result with a price range instead of competing against itself. */
  if (sizes.length > 1) {
    const prices = sizes.map((s) => s.price);
    return compact({
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": abs(`/p/${p.slug}#product`),
      name: p.family
        ? p.name.replace(/\s*[\d.]+\s*(kg|g)\s*$/i, "").trim() || p.name
        : p.name,
      description: p.longDescription || p.shortDescription || undefined,
      image: p.images.length ? p.images : undefined,
      brand: { "@type": "Brand", name: SITE.name },
      category: p.category,
      productGroupID: p.family || p.sku,
      variesBy: "https://schema.org/size",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: sizes.length,
        availability: sizes.some((s) => s.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@id": `${SITE.url}/#organization` }
      },
      hasVariant: sizes.map((s) =>
        compact({
          "@type": "Product",
          name: s.name,
          sku: s.sku,
          size: s.weight || undefined,
          weight: weightOf(s),
          url: abs(`/p/${s.slug}`),
          image: s.images.length ? s.images[0] : undefined,
          offers: offerFor(s)
        })
      )
    });
  }

  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": abs(`/p/${p.slug}#product`),
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    category: p.category,
    description: p.longDescription || p.shortDescription || undefined,
    image: p.images.length ? p.images : undefined,
    brand: { "@type": "Brand", name: SITE.name },
    size: p.weight || undefined,
    weight: weightOf(p),
    offers: offerFor(p)
  });
}

/**
 * A category or search listing. The ItemList gives Google the ordering of the
 * page's products, which is what carousel-style results are built from.
 */
export function collectionSchema({
  name, description, path, products
}: { name: string; description: string; path: string; products: Product[] }) {
  const priced = products.filter((p) => p.price > 0);
  return compact({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": abs(`${path}#collection`),
    name,
    description,
    url: abs(path),
    inLanguage: "en-IN",
    isPartOf: { "@id": `${SITE.url}/#website` },
    about: { "@id": `${SITE.url}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 60).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: abs(`/p/${p.slug}`),
        name: p.name
      }))
    },
    ...(priced.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...priced.map((p) => p.price)),
            highPrice: Math.max(...priced.map((p) => p.price)),
            offerCount: priced.length
          }
        }
      : {})
  });
}

/** Renders any schema object as a JSON-LD script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
