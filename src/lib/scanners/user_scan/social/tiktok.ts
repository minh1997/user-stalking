import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "TikTok";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * TikTok username scanner
 * Checks if a username/profile exists on TikTok
 */
export async function scanTikTok(username: string): Promise<ScanResult> {
  // Validation checks
  if (username.length < 2 || username.length > 24) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      "Length must be 2-24 characters"
    );
  }

  if (/^\d+$/.test(username)) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      "Usernames cannot contain numbers only"
    );
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      "Usernames can only contain letters, numbers, underscores and periods"
    );
  }

  if (username.startsWith(".") || username.endsWith(".")) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      "Username cannot start nor end with a period"
    );
  }

  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://www.tiktok.com/@${username}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "identity",
      "Accept-Language": "en-US,en;q=0.9",
      "sec-fetch-dest": "document",
      Connection: "keep-alive",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;
    const body = response.body || "";

    if (status === 200) {
      // Check for TikTok's "user not found" status code in the response
      if (body.toLowerCase().includes('statuscode":10221')) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username not found on TikTok"
        );
      } else {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username exists on TikTok",
          url
        );
      }
    }

    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Unable to load TikTok (status: ${status})`
    );
  } catch (error) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Unexpected exception: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
