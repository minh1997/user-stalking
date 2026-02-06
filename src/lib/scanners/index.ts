// Core types and utilities
export * from "./core";

// Email scanners
export * from "./email_scan";

// Username scanners  
export * from "./user_scan";

// Scanner registry for dynamic scanning
import { Scanner, ScanResult, ScanCategory } from "./core";
import { scanFacebook } from "./email_scan";

// Email scanner registry
export const emailScanners: Record<string, Scanner> = {
  facebook: {
    name: "Facebook",
    category: "social",
    scanType: "email",
    scan: scanFacebook,
  },
};

// Username scanner registry
export const usernameScanners: Record<string, Scanner> = {};

// Get all scanners by category
export function getScannersByCategory(
  category: ScanCategory,
  scanType: "email" | "username"
): Scanner[] {
  const registry = scanType === "email" ? emailScanners : usernameScanners;
  return Object.values(registry).filter((s) => s.category === category);
}

// Run all scanners of a specific type
export async function runAllScanners(
  input: string,
  scanType: "email" | "username",
  categories?: ScanCategory[]
): Promise<ScanResult[]> {
  const registry = scanType === "email" ? emailScanners : usernameScanners;
  const scanners = Object.values(registry).filter(
    (s) => !categories || categories.includes(s.category)
  );

  const results = await Promise.allSettled(
    scanners.map((scanner) => scanner.scan(input))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ScanResult> => r.status === "fulfilled")
    .map((r) => r.value);
}
