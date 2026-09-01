import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabase } from "../../../../lib/supabase";
import { sendOrderToQueue } from "../../../../lib/sqs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      amount,
      restaurant_owner_id,
      customer_name,
      restaurant_name,
      items,
    } = body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!
    )
      .update(sign.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Save payment in DB
    await supabase.from("payments").insert({
      user_id,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount,
      status: "success",
    });

    // Send to SQS for async notification processing
    await sendOrderToQueue({
      orderId: razorpay_order_id,
      customerId: user_id,
      restaurantOwnerId: restaurant_owner_id ?? "default-owner",
      customerName: customer_name ?? "Customer",
      restaurantName: restaurant_name ?? "Restaurant",
      totalAmount: amount,
      items: items ?? [],
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
