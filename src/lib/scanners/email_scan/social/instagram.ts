import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Instagram";
const CATEGORY = "social" as const;
const SCAN_TYPE = "email" as const;

/**
 * Instagram email scanner
 * Checks if an email is registered with Instagram by using the password recovery flow
 */
export async function scanInstagram(email: string): Promise<ScanResult> {
  try {
    const client = createClient();

    // Step 1: Visit the password reset page to get CSRF token
    const res = await client.get(
      "https://www.instagram.com/accounts/password/reset/",
      {
        followRedirect: true,
      }
    );

    // Try to get CSRF token from cookies first
    let csrf = client.getCookie("csrftoken", "https://www.instagram.com");

    // If not in cookies, try to extract from HTML
    if (!csrf) {
      const match = res.body.match(
        /["']csrf_token["']\s*:\s*["']([^"']+)["']/
      );
      if (match) {
        csrf = match[1];
      }
    }

    if (!csrf) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "CSRF token not found (IP may be flagged)"
      );
    }

    // Step 2: Submit email to the account recovery endpoint
    const headers = {
      "x-csrftoken": csrf,
      "x-ig-app-id": "936619743392459",
      "x-requested-with": "XMLHttpRequest",
      "x-asbd-id": "359341",
      origin: "https://www.instagram.com",
      referer: "https://www.instagram.com/accounts/password/reset/",
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
    };

    const response = await client.post(
      "https://www.instagram.com/api/v1/web/accounts/account_recovery_send_ajax/",
      {
        form: {
          email_or_username: email,
        },
        headers,
        throwHttpErrors: false,
      }
    );

    const statusCode = response.statusCode;

    if (statusCode === 200 || statusCode === 400) {
      try {
        const data = JSON.parse(response.body);
        const statusVal = data.status;

        if (statusVal === "ok") {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is registered with Instagram"
          );
        } else if (statusVal === "fail") {
          return createAvailableResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is not registered with Instagram"
          );
        }

        return createErrorResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Unexpected response body"
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

    if (statusCode === 429) {
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
      `HTTP ${statusCode}`
    );
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
