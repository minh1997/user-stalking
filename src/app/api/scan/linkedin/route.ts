import { NextRequest, NextResponse } from "next/server";
import { scanLinkedin } from "@/lib/scanners/user_scan/social/linkedin";

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

    // Basic username validation (alphanumeric, hyphens, underscores)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(query)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const result = await scanLinkedin(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("LinkedIn scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
