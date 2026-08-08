export const inr = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");

export function stockState(p: { stock: number; lowStockAt: number }) {
  if (p.stock <= 0) return { key: "out" as const, label: "Out of Stock" };
  if (p.stock <= p.lowStockAt) return { key: "low" as const, label: `Only ${p.stock} left` };
  return { key: "in" as const, label: "In Stock" };
}
