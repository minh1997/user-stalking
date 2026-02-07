import { NextRequest, NextResponse } from "next/server";
import { scanTikTok } from "@/lib/scanners/user_scan/social/tiktok";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const result = await scanTikTok(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("TikTok scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
