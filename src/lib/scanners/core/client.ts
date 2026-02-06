import got, { Got, Response, OptionsOfTextResponseBody } from "got";
import { CookieJar } from "tough-cookie";

export interface HttpClient {
  get: (url: string, options?: OptionsOfTextResponseBody) => Promise<Response<string>>;
  post: (url: string, options?: OptionsOfTextResponseBody) => Promise<Response<string>>;
  getCookie: (name: string, url: string) => string | undefined;
}

/**
 * Create an HTTP client with cookie support and HTTP/2
 * Similar to Python's httpx.AsyncClient
 */
export function createClient(options?: {
  followRedirect?: boolean;
  http2?: boolean;
}): HttpClient {
  const cookieJar = new CookieJar();

  const instance = got.extend({
    http2: options?.http2 ?? true,
    followRedirect: options?.followRedirect ?? false,
    cookieJar,
    timeout: {
      request: 30000,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    },
  });

  return {
    get: (url: string, options?: OptionsOfTextResponseBody) => instance.get(url, options),
    post: (url: string, options?: OptionsOfTextResponseBody) => instance.post(url, options),
    getCookie: (name: string, url: string) => {
      const cookies = cookieJar.getCookiesSync(url);
      const cookie = cookies.find((c) => c.key === name);
      return cookie?.value;
    },
  };
}

/**
 * Simple GET request helper
 */
export async function httpGet(url: string, headers?: Record<string, string>): Promise<string> {
  const client = createClient();
  const response = await client.get(url, { headers });
  return response.body;
}

/**
 * Simple POST request helper
 */
export async function httpPost(
  url: string,
  body: string | URLSearchParams,
  headers?: Record<string, string>
): Promise<string> {
  const client = createClient();
  const response = await client.post(url, {
    body: body.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
  });
  return response.body;
}
