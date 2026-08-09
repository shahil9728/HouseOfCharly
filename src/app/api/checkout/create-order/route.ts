import { NextResponse } from "next/server";
import { priceOrder, createRazorpayOrder, razorpayReady, publicKeyId, orderRef, type CartInput } from "@/lib/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Creates a Razorpay order for the CURRENT server-computed cart total. */
export async function POST(req: Request) {
  try {
    if (!razorpayReady()) {
      return NextResponse.json({ error: "Online payment is not configured." }, { status: 503 });
    }

    const body = (await req.json()) as { items?: CartInput[]; customer?: Record<string, string> };
    const priced = await priceOrder(body.items ?? []);

    if (!priced.lines.length) {
      return NextResponse.json({ error: "Your cart is empty.", problems: priced.problems }, { status: 400 });
    }
    if (priced.problems.length) {
      return NextResponse.json({ error: priced.problems[0], problems: priced.problems }, { status: 409 });
    }
    if (priced.total <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });
    }

    const ref = orderRef();
    const rzp = await createRazorpayOrder(priced.total, ref, {
      ref,
      customer: String(body.customer?.name ?? "").slice(0, 60),
      phone: String(body.customer?.phone ?? "").slice(0, 20)
    });

    // amount echoed back is Razorpay's own, in paise — the client only displays it
    return NextResponse.json({
      keyId: publicKeyId(),
      orderId: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
      ref,
      total: priced.total
    });
  } catch (err) {
    console.error("[checkout] create-order failed:", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
