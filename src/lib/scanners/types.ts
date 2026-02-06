export enum ScanStatus {
  TAKEN = "taken",
  AVAILABLE = "available",
  ERROR = "error",
}

export interface ScanResult {
  status: ScanStatus;
  reason?: string;
  siteName: string;
  category: string;
  email?: string;
  username?: string;
}

export function createTakenResult(
  siteName: string,
  category: string,
  reason?: string
): ScanResult {
  return {
    status: ScanStatus.TAKEN,
    siteName,
    category,
    reason,
  };
}

export function createAvailableResult(
  siteName: string,
  category: string,
  reason?: string
): ScanResult {
  return {
    status: ScanStatus.AVAILABLE,
    siteName,
    category,
    reason,
  };
}

export function createErrorResult(
  siteName: string,
  category: string,
  reason: string
): ScanResult {
  return {
    status: ScanStatus.ERROR,
    siteName,
    category,
    reason,
  };
}
