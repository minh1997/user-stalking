// Types shared between client and server components
// This file should NOT import any Node.js-specific modules

export enum ScanStatus {
  TAKEN = "taken",
  AVAILABLE = "available",
  ERROR = "error",
}

export type ScanCategory =
  | "social"
  | "entertainment"
  | "gaming"
  | "shopping"
  | "dev"
  | "creator"
  | "community"
  | "hosting"
  | "learning"
  | "music"
  | "sports"
  | "donation"
  | "adult"
  | "other";

export type ScanType = "email" | "username";

export interface ScanResult {
  status: ScanStatus;
  siteName: string;
  category: ScanCategory;
  scanType: ScanType;
  reason?: string;
  url?: string;
  profileData?: Record<string, unknown>;
}
