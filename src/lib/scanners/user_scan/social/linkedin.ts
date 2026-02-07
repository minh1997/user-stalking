import got from "got";
import {
  ScanResult,
  createTakenResult,
  createAvailableResult,
  createErrorResult,
} from "@/lib/scanners/core";

const SITE_NAME = "LinkedIn";
const CATEGORY = "social" as const;
const SCAN_TYPE = "username" as const;

// Indicators that a profile exists and loaded successfully
const PROFILE_EXISTS_HINTS = [
  "public_profile",
  "pageKey",
  "miniProfile",
  "firstName",
  "og:title",
];

// Social bot User-Agents that LinkedIn whitelists for link previews
const BOT_USER_AGENTS = [
  "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
  "Twitterbot/1.0",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
];

/**
 * LinkedIn username scanner
 * Checks if a username/profile exists on LinkedIn
 * Uses social bot User-Agents which LinkedIn whitelists for link previews
 */
export async function scanLinkedin(username: string): Promise<ScanResult> {
  try {
    const url = `https://www.linkedin.com/in/${username}/`;

    // Try multiple bot User-Agents until one succeeds
    for (const userAgent of BOT_USER_AGENTS) {
      const response = await got.get(url, {
        http2: true,
        followRedirect: true,
        throwHttpErrors: false,
        timeout: { request: 10000 },
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const status = response.statusCode;
      const text = response.body || "";

      // 404 = Profile definitely doesn't exist
      if (status === 404) {
        return createAvailableResult(
          SITE_NAME,
          CATEGORY,
          SCAN_TYPE,
          "Username not found on LinkedIn"
        );
      }

      // 999 = Blocked by this UA, try next one
      if (status === 999) {
        continue;
      }

      // Check if we got a successful response with profile content
      if (status === 200) {
        const hasProfileContent = PROFILE_EXISTS_HINTS.some((hint) => 
          text.includes(hint)
        );
        
        if (hasProfileContent) {
          return createTakenResult(
            SITE_NAME,
            CATEGORY,
            SCAN_TYPE,
            "Username exists on LinkedIn",
            url
          );
        }
      }
    }

    // If all User-Agents were blocked (999), we can't determine
    return createErrorResult(
      SITE_NAME,
      CATEGORY,
      SCAN_TYPE,
      "Unable to verify - LinkedIn blocking requests"
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
