import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Medium";
const CATEGORY = "creator" as const;
const SCAN_TYPE = "username" as const;

/**
 * Medium username scanner
 * Checks if a username/profile exists on Medium
 */
export async function scanMedium(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://medium.com/@${username}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "identity",
      "upgrade-insecure-requests": "1",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;
    const body = response.body || "";

    if (status === 200) {
      // Check for the profile username meta tag
      const usernameTag = `property="profile:username" content="${username}"`;

      if (body.includes(usernameTag)) {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username exists on Medium",
          url
        );
      } else {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username not found on Medium"
        );
      }
    }

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
