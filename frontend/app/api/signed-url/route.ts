import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LAMBDA_URL = process.env.LAMBDA_SIGNED_URL;

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Call Lambda instead of generating URL here
    const res = await fetch(`${LAMBDA_URL}?key=${key}`);
    const data = await res.json();

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
