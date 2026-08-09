import { NextResponse } from "next/server";
import { verifyRazorpaySignature, priceOrder, recordOrder, type CartInput } from "@/lib/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms a Razorpay payment. The signature check is the whole point:
 * without it a crafted POST could mark any order paid.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      ref?: string;
      items?: CartInput[];
      customer?: Record<string, string>;
    };

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;

    if (!verifyRazorpaySignature(orderId ?? "", paymentId ?? "", signature ?? "")) {
      console.warn("[checkout] signature verification FAILED", { orderId, paymentId });
      return NextResponse.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
    }

    const priced = await priceOrder(body.items ?? []);
    await recordOrder({
      ref: body.ref,
      placedAt: new Date().toISOString(),
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      customer: body.customer,
      lines: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total
    });

    return NextResponse.json({ ok: true, ref: body.ref, paymentId });
  } catch (err) {
    console.error("[checkout] verify failed:", err);
    return NextResponse.json({ ok: false, error: "Verification failed." }, { status: 500 });
  }
}
