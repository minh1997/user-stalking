import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "X";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * X (Twitter) username scanner
 * Checks if a username is available on X using the username_available API
 */
export async function scanXUsername(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = "https://api.twitter.com/i/users/username_available.json";

    const params = new URLSearchParams({
      username: username,
      full_name: "ichika",
      email: "ichika@example.com",
    });

    const headers = {
      Authority: "api.twitter.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "application/json",
    };

    const response = await client.get(`${url}?${params.toString()}`, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;

    // Handle error status codes
    if (status === 401 || status === 403 || status === 429) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        `API error (status: ${status})`
      );
    }

    if (status === 200) {
      try {
        const data = JSON.parse(response.body);

        if (data.valid === true) {
          return createAvailableResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Username is available on X"
          );
        }

        if (data.reason === "taken") {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Username is taken on X",
            `https://x.com/${username}`
          );
        }

        if (data.reason === "improper_format" || data.reason === "invalid_username") {
          return createErrorResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            `X says: ${data.desc || "Invalid username format"}`
          );
        }

        return createErrorResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          `Unexpected response: ${data.reason || "unknown"}`
        );
      } catch {
        return createErrorResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Failed to parse response"
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
