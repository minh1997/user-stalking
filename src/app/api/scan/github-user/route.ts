import { NextRequest, NextResponse } from "next/server";
import { scanGitHubUsername } from "@/lib/scanners/user_scan/dev/github";

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

    // Basic username validation (alphanumeric, hyphens, and underscores)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(query)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const result = await scanGitHubUsername(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("GitHub username scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
