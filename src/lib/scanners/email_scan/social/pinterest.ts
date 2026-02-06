import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Pinterest";
const CATEGORY = "social" as const;
const SCAN_TYPE = "email" as const;

/**
 * Pinterest email scanner
 * Checks if an email is registered with Pinterest using the registration API
 */
export async function scanPinterest(email: string): Promise<ScanResult> {
  try {
    const client = createClient();

    const dataStr = JSON.stringify({
      options: {
        url: "/v3/register/exists/",
        data: { email },
      },
      context: {},
    });

    const response = await client.get(
      "https://www.pinterest.com/resource/ApiResource/get/",
      {
        searchParams: {
          source_url: "/signup/step1/",
          data: dataStr,
          _: String(Date.now()),
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
          Accept: "application/json, text/javascript, */*, q=0.01",
          "Accept-Language": "en-US,en;q=0.9",
          "x-pinterest-pws-handler": "www/signup/[step].js",
          "x-app-version": "2503cde",
          "x-requested-with": "XMLHttpRequest",
          "x-pinterest-source-url": "/signup/step1/",
          "x-pinterest-appstate": "active",
          origin: "https://www.pinterest.com",
          referer: "https://www.pinterest.com/",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          priority: "u=1, i",
        },
        throwHttpErrors: false,
        timeout: { request: 5000 },
      }
    );

    if (response.statusCode === 200) {
      try {
        const respJson = JSON.parse(response.body);
        const resourceResponse = respJson.resource_response || {};
        const exists = resourceResponse.data;

        if (exists === true) {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is registered with Pinterest"
          );
        } else if (exists === false) {
          return createAvailableResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is not registered with Pinterest"
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
    }

    if (response.statusCode === 403) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Access Forbidden (403) - Potential IP Block"
      );
    }

    if (response.statusCode === 429) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Rate limited (429)"
      );
    }

    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `HTTP ${response.statusCode}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    
    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Connection timed out"
      );
    }

    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Exception: ${errorMessage}`
    );
  }
}
