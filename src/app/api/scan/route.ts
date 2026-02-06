import { NextRequest, NextResponse } from "next/server";
import { scanFacebook, ScanResult } from "@/lib/scanners";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, scanners = ["facebook"] } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const results: ScanResult[] = [];

    // Run selected scanners
    const scannerPromises: Promise<ScanResult>[] = [];

    if (scanners.includes("facebook")) {
      scannerPromises.push(scanFacebook(email));
    }

    // Add more scanners here as they are implemented
    // if (scanners.includes("instagram")) {
    //   scannerPromises.push(scanInstagram(email));
    // }

    const scanResults = await Promise.all(scannerPromises);
    results.push(...scanResults);

    return NextResponse.json({
      success: true,
      email,
      results,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
