import { NextRequest, NextResponse } from "next/server";
import { scanXUsername } from "@/lib/scanners/user_scan/social/x";

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

    const result = await scanXUsername(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("X username scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
