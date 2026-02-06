import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
  createClient,
} from "@/lib/scanners/core";

const SITE_NAME = "Spotify";
const CATEGORY = "music" as const;
const SCAN_TYPE = "email" as const;

/**
 * Spotify email scanner
 * Checks if an email is registered with Spotify by using the signup validation API
 */
export async function scanSpotify(email: string): Promise<ScanResult> {
  try {
    const client = createClient({ followRedirect: true, http2: false });

    // Step 1: Visit signup page to get cookies/session
    const getUrl = "https://www.spotify.com/in-en/signup";
    const getHeaders = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "identity",
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "upgrade-insecure-requests": "1",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      referer: "https://www.spotify.com/us/signup",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=0, i",
    };

    await client.get(getUrl, { headers: getHeaders, throwHttpErrors: false });

    // Step 2: Post to validate endpoint
    const postUrl =
      "https://spclient.wg.spotify.com/signup/public/v2/account/validate";

    const payload = {
      fields: [
        {
          field: "FIELD_EMAIL",
          value: email,
        },
      ],
      client_info: {
        api_key: "a1e486e2729f46d6bb368d6b2bcda326",
        app_version: "v2",
        capabilities: [1],
        installation_id: "3740cfb5-c76f-4ae9-9a94-f0989d7ae5a4",
        platform: "www",
        client_id: "",
      },
      tracking: {
        creation_flow: "",
        creation_point: "https://www.spotify.com/us/signup",
        referrer: "",
        origin_vertical: "",
        origin_surface: "",
      },
    };

    const postHeaders = {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Encoding": "identity",
      "Content-Type": "application/json",
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      origin: "https://www.spotify.com",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://www.spotify.com/",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
    };

    let body: string;
    let statusCode: number;

    try {
      const response = await client.post(postUrl, {
        body: JSON.stringify(payload),
        headers: postHeaders,
        throwHttpErrors: false,
      });
      body = response.body;
      statusCode = response.statusCode;
    } catch (httpError) {
      const err = httpError as {
        response?: { body?: string; statusCode?: number };
      };
      if (err.response) {
        body = err.response.body || "";
        statusCode = err.response.statusCode || 0;
      } else {
        throw httpError;
      }
    }

    // Parse the response
    try {
      const data = JSON.parse(body);

      // Check for email already exists error in various response formats
      // Format 1: { "error": { "already_exists": {} } }
      if (data.error && typeof data.error === "object" && "already_exists" in data.error) {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is registered with Spotify"
        );
      }

      // Format 2: { "error": "already_exists" } (string)
      if (data.error && typeof data.error === "string" && data.error.includes("already_exists")) {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is registered with Spotify"
        );
      }

      // Format 3: { "errors": { "email": "already_exists" } }
      if (data.errors?.email === "already_exists") {
        return createTakenResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is registered with Spotify"
        );
      }

      // Check for field-level errors
      if (data.fields) {
        const emailField = data.fields.find(
          (f: { field: string; error?: string }) => f.field === "FIELD_EMAIL"
        );
        if (emailField?.error === "already_exists") {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Email is registered with Spotify"
          );
        }
      }

      // Success means email is available
      if (data.success === true) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is not registered with Spotify"
        );
      }

      // If status 200 or 400 with no error object, email is available
      if ((statusCode === 200 || statusCode === 400) && !data.error && !data.errors) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Email is not registered with Spotify"
        );
      }

      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        `Unexpected response (status: ${statusCode}): ${body.substring(0, 200)}`
      );
    } catch {
      return createErrorResult(
        SITE_NAME,
        CATEGORY,
        SCAN_TYPE,
        `Failed to parse response (status: ${statusCode}): ${body.substring(0, 200)}`
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
