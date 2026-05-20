export const runtime = "nodejs"; // Razorpay SDK requires Node.js runtime

import { NextResponse } from "next/server";
import { razorpay } from "../../../../lib/razorpay";

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const { amount } = body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json(order);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}