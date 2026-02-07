import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "GitHub";
const CATEGORY = "dev" as const;
const SCAN_TYPE = "username" as const;

const GITHUB_INVALID_MSG =
  "Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.";

/**
 * GitHub username scanner
 * Checks if a username is available on GitHub using the signup check API
 */
export async function scanGitHubUsername(username: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });
    const url = `https://github.com/signup_check/username?value=${encodeURIComponent(username)}`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://github.com/signup?source=form-home-signup",
      priority: "u=1, i",
    };

    const response = await client.get(url, {
      headers,
      throwHttpErrors: false,
    });

    const status = response.statusCode;
    const body = response.body || "";

    // 200 = Username is available
    if (status === 200) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username is available on GitHub"
      );
    }

    // 422 = Username is taken or invalid
    if (status === 422) {
      if (body.includes(GITHUB_INVALID_MSG)) {
        return createErrorResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Cannot start/end with hyphen or use double hyphens, underscores"
        );
      }

      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Username is taken on GitHub",
        `https://github.com/${username}`
      );
    }

    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Unexpected response (status: ${status})`
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
