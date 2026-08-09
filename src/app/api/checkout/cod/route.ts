import { NextResponse } from "next/server";
import { priceOrder, recordOrder, orderRef, type CartInput } from "@/lib/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cash on delivery — no gateway, but the order is still priced and recorded here. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: CartInput[]; customer?: Record<string, string> };
    const priced = await priceOrder(body.items ?? []);

    if (!priced.lines.length) {
      return NextResponse.json({ error: "Your cart is empty.", problems: priced.problems }, { status: 400 });
    }
    if (priced.problems.length) {
      return NextResponse.json({ error: priced.problems[0], problems: priced.problems }, { status: 409 });
    }

    const ref = orderRef();
    await recordOrder({
      ref,
      placedAt: new Date().toISOString(),
      paymentMethod: "cod",
      paymentStatus: "pending",
      customer: body.customer,
      lines: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total
    });

    return NextResponse.json({ ok: true, ref, total: priced.total });
  } catch (err) {
    console.error("[checkout] cod failed:", err);
    return NextResponse.json({ error: "Could not place the order. Please try again." }, { status: 500 });
  }
}
