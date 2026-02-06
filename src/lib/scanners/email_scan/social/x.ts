import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "X";
const CATEGORY = "social" as const;
const SCAN_TYPE = "email" as const;

/**
 * X (Twitter) email scanner
 * Checks if an email is registered with X using the email availability API
 */
export async function scanX(email: string): Promise<ScanResult> {
  try {
    const client = createClient();

    const response = await client.get(
      "https://api.x.com/i/users/email_available.json",
      {
        searchParams: { email },
        headers: {
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
          "accept-encoding": "gzip, deflate, br, zstd",
          "sec-ch-ua-platform": '"Android"',
          "sec-ch-ua":
            '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
          "x-twitter-client-language": "en",
          "sec-ch-ua-mobile": "?1",
          "x-twitter-active-user": "yes",
          origin: "https://x.com",
          priority: "u=1, i",
        },
        throwHttpErrors: false,
      }
    );

    if (response.statusCode === 429) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Rate limited - wait a few minutes"
      );
    }

    try {
      const data = JSON.parse(response.body);
      const taken = data.taken;

      if (taken === true) {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is registered with X"
        );
      } else if (taken === false) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is not registered with X"
        );
      }

      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Unexpected response format"
      );
    } catch {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Failed to parse response JSON"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Exception: ${errorMessage}`
    );
  }
}
