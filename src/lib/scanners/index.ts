// Scanner registry for dynamic scanning
import { Scanner, ScanResult, ScanCategory } from "./core";
import { scanFacebook, scanInstagram, scanX, scanPinterest } from "./email_scan";
import { scanLinkedin } from "./user_scan";

// Re-export types for external use
export type { ScanResult, ScanCategory, Scanner } from "./core";
export { ScanStatus } from "./core";

// Email scanner registry
export const emailScanners: Record<string, Scanner> = {
  facebook: {
    name: "Facebook",
    category: "social",
    scanType: "email",
    scan: scanFacebook,
  },
  instagram: {
    name: "Instagram",
    category: "social",
    scanType: "email",
    scan: scanInstagram,
  },
  x: {
    name: "X",
    category: "social",
    scanType: "email",
    scan: scanX,
  },
  pinterest: {
    name: "Pinterest",
    category: "social",
    scanType: "email",
    scan: scanPinterest,
  },
};

// Username scanner registry
export const usernameScanners: Record<string, Scanner> = {
  linkedin: {
    name: "LinkedIn",
    category: "social",
    scanType: "username",
    scan: scanLinkedin,
  },
};

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
