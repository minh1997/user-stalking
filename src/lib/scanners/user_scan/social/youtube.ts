import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "YouTube";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * YouTube username scanner
 * Checks if a username/channel handle exists on YouTube
 */
export async function scanYouTube(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://m.youtube.com/@${username}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "identity",
      "sec-ch-dpr": "2.75",
      "sec-ch-viewport-width": "980",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-full-version": '"143.0.7499.52"',
      "sec-ch-ua-arch": '""',
      "sec-ch-ua-platform": '"Android"',
      "sec-ch-ua-platform-version": '"15.0.0"',
      "sec-ch-ua-model": '"I2404"',
      "sec-ch-ua-bitness": '""',
      "sec-ch-ua-wow64": "?0",
      "sec-ch-ua-full-version-list":
        '"Google Chrome";v="143.0.7499.52", "Chromium";v="143.0.7499.52", "Not A(Brand";v="24.0.0.0"',
      "sec-ch-ua-form-factors": '"Mobile"',
      "upgrade-insecure-requests": "1",
      "x-browser-channel": "stable",
      "x-browser-year": "2025",
      "x-browser-copyright": "Copyright 2025 Google LLC. All Rights reserved.",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;

    // 404 = Channel doesn't exist (available)
    if (status === 404) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username not found on YouTube"
      );
    }

    // 200 = Channel exists (taken)
    if (status === 200) {
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username exists on YouTube",
        `https://youtube.com/@${username}`
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
