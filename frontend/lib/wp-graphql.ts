import { getWpOrigin } from "@/lib/wp-client";

export class WpGraphqlError extends Error {
  public errors: unknown[];

  constructor(message: string, errors: unknown[]) {
    super(message);
    this.name = "WpGraphqlError";
    this.errors = errors;
  }
}

export async function wpGraphqlFetch<
  TData,
  TVariables extends Record<string, unknown> | undefined,
>(
  query: string,
  variables?: TVariables,
  options?: { token?: string | null },
): Promise<TData> {
  const origin = getWpOrigin();
  if (!origin) {
    throw new Error(
      "NEXT_PUBLIC_WP_ORIGIN (ou NEXT_PUBLIC_WP_API_URL) doit être défini",
    );
  }

  const doFetch = async (targetOrigin: string) =>
    fetch(`${targetOrigin}/graphql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(90000),
    });

  const res = await doFetch(origin);

  const json = (await res.json().catch(() => null)) as {
    data?: TData;
    errors?: Array<{ message?: string }>;
  } | null;

  const errors = json && Array.isArray(json.errors) ? json.errors : [];
  if (!res.ok || errors.length > 0 || !json || !("data" in json)) {
    const message =
      errors.find((e) => e && typeof e.message === "string" && e.message)
        ?.message || `Erreur GraphQL (${res.status})`;
    throw new WpGraphqlError(message, errors);
  }

  return json.data as TData;
}
