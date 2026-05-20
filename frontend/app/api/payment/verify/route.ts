import { NextResponse } from "next/server";

import crypto from "crypto";
import { supabase } from "../../../../lib/supabase";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      amount
    } = body;

    const sign =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET!
        )
        .update(sign.toString())
        .digest("hex");

    const isAuthentic =
      expectedSignature ===
      razorpay_signature;

    if (!isAuthentic) {

      return NextResponse.json(
        {
          success: false,
        },
        { status: 400 }
      );
    }
    await supabase.from("payments").insert({
  user_id,
  order_id: razorpay_order_id,
  payment_id: razorpay_payment_id,
  amount,
  status: "success",
});

    // save payment in DB here

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}