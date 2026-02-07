import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Discord";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

/**
 * Discord username scanner
 * Checks if a username is available on Discord using the username-attempt API
 */
export async function scanDiscord(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url =
      "https://discord.com/api/v9/unique-username/username-attempt-unauthed";

    const headers = {
      authority: "discord.com",
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/json",
      origin: "https://discord.com",
      referer: "https://discord.com/register",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    };

    const payload = { username: username };

    const response = await client.post(url, {
      headers,
      body: JSON.stringify(payload),
      throwHttpErrors: false,
      timeout: { request: 3000 },
    });

    const status = response.statusCode;

    if (status === 200) {
      try {
        const data = JSON.parse(response.body);

        if (data.taken === true) {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Username is taken on Discord"
          );
        }

        if (data.taken === false) {
          return createAvailableResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Username is available on Discord"
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
          "Failed to parse response"
        );
      }
    }

    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Invalid status code: ${status}`
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
