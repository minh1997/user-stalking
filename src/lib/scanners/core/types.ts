// Re-export shared types from the client-safe types file
export { ScanStatus, type ScanCategory, type ScanType, type ScanResult } from "@/types/scan";
import { ScanStatus, ScanCategory, ScanType, ScanResult } from "@/types/scan";

export interface Scanner {
  name: string;
  category: ScanCategory;
  scanType: ScanType;
  scan: (input: string) => Promise<ScanResult>;
}

export function createTakenResult(
  siteName: string,
  category: ScanCategory,
  scanType: ScanType,
  reason?: string,
  url?: string,
  profileData?: Record<string, unknown>
): ScanResult {
  return {
    status: ScanStatus.TAKEN,
    siteName,
    category,
    scanType,
    reason,
    url,
    profileData,
  };
}

export function createAvailableResult(
  siteName: string,
  category: ScanCategory,
  scanType: ScanType,
  reason?: string
): ScanResult {
  return {
    status: ScanStatus.AVAILABLE,
    siteName,
    category,
    scanType,
    reason,
  };
}

export function createErrorResult(
  siteName: string,
  category: ScanCategory,
  scanType: ScanType,
  reason: string
): ScanResult {
  return {
    status: ScanStatus.ERROR,
    siteName,
    category,
    scanType,
    reason,
  };
}
