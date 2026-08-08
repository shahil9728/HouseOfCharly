export type Category = string;

export interface Product {
  /** Item code from the inventory sheet. Stable identity across the app. */
  sku: string;
  name: string;
  slug: string;
  category: Category;
  /** Groups pack sizes of the same item, e.g. all Kaju W-320 sizes. */
  family: string;
  unit: string;
  weight: string | null;

  price: number;
  /** Struck-through price = price + discount. Null when there is no offer. */
  mrp: number | null;
  discountPct: number;

  stock: number;
  lowStockAt: number;

  images: string[];
  shortDescription: string;
  longDescription: string;

  seoTitle: string;
  seoDescription: string;

  featured: boolean;
  bestseller: boolean;
  sortOrder: number;
  /** False when the row has no price — hidden from the storefront. */
  sellable: boolean;
}

export interface DataIssue {
  sku: string;
  name: string;
  issue: string;
  severity: "error" | "warning";
}

export interface Catalog {
  products: Product[];
  categories: Category[];
  issues: DataIssue[];
  /** True when the sheet could not be reached and we served a fallback. */
  degraded: boolean;
  fetchedAt: string;
}

export interface CartLine {
  sku: string;
  qty: number;
}
