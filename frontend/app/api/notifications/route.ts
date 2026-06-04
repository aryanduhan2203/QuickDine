import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userIds, title, message, url } = await req.json();

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json(
        { error: "OneSignal credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const payload: any = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },
    };

    if (url) {
      payload.url = url;
    }

    if (userIds && userIds.length > 0) {
      payload.target_channel = "push";
      payload.include_aliases = {
        external_id: userIds,
      };
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to send push notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process push notification trigger" },
      { status: 500 }
    );
  }
}
