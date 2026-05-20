import { NextResponse } from "next/server";
import crypto from "crypto";
// import { supabase } from "../../../../lib/supabase"; // Import this when you are ready to update the database

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify the webhook signature to ensure it came from Razorpay
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Handle different events
    if (payload.event === "payment.failed") {
      const paymentData = payload.payload.payment.entity;
      console.log("Webhook: Payment failed for Order ID:", paymentData.order_id);
      
      // TODO: Update your database using Supabase
      // e.g., await supabase.from('orders').update({ status: 'Failed' }).eq('id', paymentData.order_id);
    } 
    else if (payload.event === "payment.captured") {
      const paymentData = payload.payload.payment.entity;
      console.log("Webhook: Payment captured for Order ID:", paymentData.order_id);
      
      // TODO: Update your database
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}