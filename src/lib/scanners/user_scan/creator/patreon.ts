import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Patreon";
const CATEGORY = "creator" as const;
const SCAN_TYPE = "username" as const;

/**
 * Patreon username scanner
 * Checks if a username/profile exists on Patreon
 */
export async function scanPatreon(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://www.patreon.com/${username}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "identity",
      "Accept-Language": "en-US,en;q=0.9",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
      timeout: { request: 15000 },
    });

    const status = response.statusCode;

    // 404 = Profile doesn't exist (available)
    if (status === 404) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username not found on Patreon"
      );
    }

    // 200 = Profile exists (taken)
    if (status === 200) {
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username exists on Patreon",
        url
      );
    }

    // Any other status is unexpected
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Unexpected status code: ${status}`
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
