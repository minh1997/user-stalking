import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Duolingo";
const CATEGORY = "learning" as const;
const SCAN_TYPE = "email" as const;

/**
 * Duolingo email scanner
 * Checks if an email is registered with Duolingo using their users API
 */
export async function scanDuolingo(email: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://www.duolingo.com/2017-06-30/users?email=${encodeURIComponent(email)}`;

    const headers = {
      authority: "www.duolingo.com",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
      Referer: "https://www.duolingo.com/",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;

    if (status === 200) {
      try {
        const data = JSON.parse(response.body);

        // Duolingo returns a list of users matching the email
        if (data.users && data.users.length > 0) {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is registered with Duolingo"
          );
        } else {
          return createAvailableResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is not registered with Duolingo"
          );
        }
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
      `HTTP ${status}`
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
