import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Facebook";
const CATEGORY = "social" as const;
const SCAN_TYPE = "email" as const;

/**
 * Facebook email scanner
 * Checks if an email is registered with Facebook by using the password recovery flow
 */
export async function scanFacebook(email: string): Promise<ScanResult> {
  try {
    const client = createClient();

    // Step 1: Initialize session by visiting mobile login page
    await client.get("https://m.facebook.com/login/");

    // Step 2: Get the main Facebook page to extract tokens
    const res2 = await client.get("https://www.facebook.com", {
      searchParams: { _rdr: "" },
      headers: {
        "upgrade-insecure-requests": "1",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        referer: "https://www.google.com/",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        priority: "u=0, i",
      },
    });

    const html = res2.body;

    // Extract tokens (jazoest and lsd) from the HTML
    const jazoestMatch = html.match(/name="jazoest" value="(\d+)"/);
    const lsdMatch = html.match(/name="lsd" value="([^"]+)"/);

    if (!jazoestMatch || !lsdMatch) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Failed to extract tokens (LSD/Jazoest)"
      );
    }

    const jazoest = jazoestMatch[1];
    const lsd = lsdMatch[1];

    // Step 3: Submit the email to the identify endpoint
    const payload = new URLSearchParams({
      jazoest,
      lsd,
      email,
      did_submit: "1",
      __user: "0",
      __a: "1",
      __req: "7",
    });

    const response = await client.post(
      "https://www.facebook.com/ajax/login/help/identify.php",
      {
        searchParams: { ctx: "recover" },
        body: payload.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "sec-ch-ua-full-version-list":
            '"Google Chrome";v="143.0.7499.192", "Chromium";v="143.0.7499.192", "Not A(Brand";v="24.0.0.0"',
          "sec-ch-ua-platform": '"Linux"',
          "sec-ch-ua-model": '""',
          "sec-ch-ua-mobile": "?0",
          "x-asbd-id": "359341",
          "x-fb-lsd": lsd,
          "sec-ch-prefers-color-scheme": "dark",
          "sec-ch-ua-platform-version": '""',
          origin: "https://www.facebook.com",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer:
            "https://www.facebook.com/login/identify/?ctx=recover&ars=facebook_login&from_login_screen=0",
          priority: "u=1, i",
        },
      }
    );

    const body = response.body;

    // Check the response to determine if the email is registered
    if (body.includes("redirectPageTo") && body.includes("ServerRedirect")) {
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Email is registered with Facebook"
      );
    } else if (
      body.includes("No search results") ||
      body.includes("Your search did not return any results.")
    ) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Email is not registered with Facebook"
      );
    } else {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Unexpected response from Facebook"
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return createErrorResult(SITE_NAME, CATEGORY, SCAN_TYPE, `Exception: ${errorMessage}`);
  }
}
