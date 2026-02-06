import { NextRequest, NextResponse } from "next/server";
import { 
  emailScanners, 
  usernameScanners,
  runAllScanners,
  ScanResult,
  ScanCategory 
} from "@/lib/scanners";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      searchType = "email",
      scanners,
      categories 
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query (email or username) is required" },
        { status: 400 }
      );
    }

    // Validate based on search type
    if (searchType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(query)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    let results: ScanResult[] = [];

    if (scanners && scanners.length > 0) {
      // Run specific scanners
      const registry = searchType === "email" ? emailScanners : usernameScanners;
      const scannerPromises = scanners
        .filter((name: string) => registry[name])
        .map((name: string) => registry[name].scan(query));
      
      const scanResults = await Promise.allSettled(scannerPromises);
      results = scanResults
        .filter((r): r is PromiseFulfilledResult<ScanResult> => r.status === "fulfilled")
        .map((r) => r.value);
    } else {
      // Run all scanners (optionally filtered by categories)
      results = await runAllScanners(
        query,
        searchType,
        categories as ScanCategory[] | undefined
      );
    }

    return NextResponse.json({
      success: true,
      query,
      searchType,
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

// GET endpoint to list available scanners
export async function GET() {
  return NextResponse.json({
    emailScanners: Object.entries(emailScanners).map(([key, scanner]) => ({
      id: key,
      name: scanner.name,
      category: scanner.category,
    })),
    usernameScanners: Object.entries(usernameScanners).map(([key, scanner]) => ({
      id: key,
      name: scanner.name,
      category: scanner.category,
    })),
  });
}
