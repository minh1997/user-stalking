import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "GitHub";
const CATEGORY = "dev" as const;
const SCAN_TYPE = "email" as const;

/**
 * GitHub email scanner
 * Checks if an email is registered with GitHub by using the signup flow
 */
export async function scanGitHub(email: string): Promise<ScanResult> {
  try {
    // GitHub requires follow redirects and proper session handling
    const client = createClient({ followRedirect: true, http2: true });

    // Step 1: Get the signup page to extract CSRF token
    const signupUrl = "https://github.com/signup";
    const headers1 = {
      host: "github.com",
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://www.google.com/",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    };

    const res1 = await client.get(signupUrl, { headers: headers1 });
    const html = res1.body;

    // Extract CSRF token from HTML - try multiple patterns
    let csrfToken: string | null = null;
    
    // Pattern 1: data-csrf attribute with value
    const csrfMatch1 = html.match(/data-csrf="true"\s+value="([^"]+)"/);
    if (csrfMatch1) {
      csrfToken = csrfMatch1[1];
    }
    
    // Pattern 2: name="authenticity_token" value="..."
    if (!csrfToken) {
      const csrfMatch2 = html.match(/name="authenticity_token"\s+value="([^"]+)"/);
      if (csrfMatch2) {
        csrfToken = csrfMatch2[1];
      }
    }
    
    // Pattern 3: value="..." name="authenticity_token"
    if (!csrfToken) {
      const csrfMatch3 = html.match(/value="([^"]+)"\s+name="authenticity_token"/);
      if (csrfMatch3) {
        csrfToken = csrfMatch3[1];
      }
    }

    // Pattern 4: Look for meta csrf-token
    if (!csrfToken) {
      const csrfMatch4 = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
      if (csrfMatch4) {
        csrfToken = csrfMatch4[1];
      }
    }

    if (!csrfToken) {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Failed to extract GitHub authenticity_token"
      );
    }

    // Step 2: Check email validity
    const checkUrl = "https://github.com/email_validity_checks";
    const payload = new URLSearchParams({
      authenticity_token: csrfToken,
      value: email,
    });

    const headers2 = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      Accept: "text/html, application/xhtml+xml",
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      origin: "https://github.com",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://github.com/signup",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    let response;
    let body: string;
    let statusCode: number;

    try {
      response = await client.post(checkUrl, {
        body: payload.toString(),
        headers: headers2,
        throwHttpErrors: false, // Don't throw on 4xx/5xx
      });
      body = response.body;
      statusCode = response.statusCode;
    } catch (httpError) {
      // Handle HTTP errors that still get thrown
      const err = httpError as { response?: { body?: string; statusCode?: number } };
      if (err.response) {
        body = err.response.body || "";
        statusCode = err.response.statusCode || 0;
      } else {
        throw httpError;
      }
    }

    // Check the response to determine if the email is registered
    // 422 with "already associated" means taken
    if (body.includes("already associated with an account")) {
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Email is already associated with a GitHub account"
      );
    } else if (statusCode === 200 && body.includes("Email is available")) {
      return createAvailableResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Email is not registered with GitHub"
      );
    } else if (statusCode === 422) {
      // 422 can mean either taken or invalid - check body for details
      if (body.includes("Email is invalid") || body.includes("invalid")) {
        return createErrorResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Invalid email format for GitHub"
        );
      }
      // Default 422 is likely taken
      return createTakenResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        "Email appears to be registered with GitHub"
      );
    } else {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        `Unexpected status code: ${statusCode}`
      );
    }
  } catch (error) {
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      `Unexpected exception: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
