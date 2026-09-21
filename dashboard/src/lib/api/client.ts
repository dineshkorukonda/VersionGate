export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api/v1";

/** Routes mounted at `/api` (GitHub App) — not under `/api/v1`. */
export function githubApiBase(): string {
  const v = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "");
  if (!v) return "/api";
  return v.replace(/\/api\/v1$/i, "/api");
}

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function request<T>(method: string, path: string, body?: unknown, baseUrl: string = API_BASE): Promise<T> {
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    let msg = `HTTP ${res.status}`;
    if (typeof data === "object" && data !== null) {
      const o = data as { message?: unknown; error?: unknown };
      if (o.message != null && String(o.message)) msg = String(o.message);
      else if (o.error != null && String(o.error)) msg = String(o.error);
    }
    throw new ApiError(msg, res.status, data);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
