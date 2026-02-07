import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Reddit";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * Reddit username scanner
 * Checks if a username/profile exists on Reddit
 */
export async function scanReddit(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://www.reddit.com/user/${username}/`;

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
    });

    const status = response.statusCode;
    const body = response.body || "";

    if (status === 200) {
      // Check for Reddit's "user not found" message
      if (body.includes("Sorry, nobody on Reddit goes by that name.")) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username not found on Reddit"
        );
      } else {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username exists on Reddit",
          url
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
