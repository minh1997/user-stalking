import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Instagram";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * Instagram username scanner
 * Checks if a username/profile exists on Instagram using the web profile API
 */
export async function scanInstagramUsername(
  username: string
): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: true });
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `https://www.instagram.com/${username}/`,
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;

    // 404 = Profile doesn't exist (available)
    if (status === 404) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username not found on Instagram"
      );
    }

    // 200 = Profile exists (taken)
    if (status === 200) {
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username exists on Instagram",
        `https://instagram.com/${username}`
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
