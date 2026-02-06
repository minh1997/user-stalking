import { NextRequest, NextResponse } from "next/server";
import { scanFacebook } from "@/lib/scanners/email_scan/social/facebook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(query)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await scanFacebook(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Facebook scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
