if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export class WpApiError extends Error {
  status: number;
  data: unknown;

  constructor(input: { message: string; status: number; data: unknown }) {
    super(input.message);
    this.name = "WpApiError";
    this.status = input.status;
    this.data = input.data;
  }
}

function getWpOriginFromApiUrl(apiUrl: string) {
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return "";
  }
}

export function getWpOrigin() {
  const explicit = process.env.NEXT_PUBLIC_WP_ORIGIN || "";
  if (explicit) return explicit.replace(/\/+$/, "");

  const apiUrl = process.env.NEXT_PUBLIC_WP_API_URL || "";
  const origin = getWpOriginFromApiUrl(apiUrl);
  return origin.replace(/\/+$/, "");
}

export type WpFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export async function wpFetch<T>(path: string, options: WpFetchOptions = {}) {
  const origin = getWpOrigin();
  if (!origin) {
    throw new Error(
      "NEXT_PUBLIC_WP_ORIGIN (ou NEXT_PUBLIC_WP_API_URL) doit être défini",
    );
  }

  const url = `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const doFetch = async (targetUrl: string) =>
    fetch(targetUrl, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

  const res = await doFetch(url);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string" &&
        (data as { message: string }).message) ||
      `Erreur WordPress (${res.status})`;
    throw new WpApiError({ message, status: res.status, data });
  }

  return data as T;
}
