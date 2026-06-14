/**
 * Tiny typed fetch helpers. All calls go through `/api/*` which Vite proxies
 * to the .NET API in dev, and which the API serves directly in prod.
 *
 * 401 from any API call means the cookie is missing or expired — we surface
 * an `Unauthorized` error so pages can redirect to /signin.
 */

export class Unauthorized extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "Unauthorized";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<TReq, TRes>(path: string, body?: TReq): Promise<TRes> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return (await res.json()) as TRes;
}

export interface MeResponse {
  isAuthenticated: boolean;
  name?: string | null;
  email?: string | null;
  provider?: string;
}

export interface ContestResponse {
  success: boolean;
  message: string;
  recordedAt: string;
}

export interface ChatRequestBody {
  history: { role: string; content: string }[];
  message: string;
}

export interface ChatResponseBody {
  reply: string;
}

/** Send the browser through the server-side OIDC challenge. */
export function startSignIn(returnUrl?: string) {
  const target = returnUrl ?? window.location.pathname + window.location.search;
  window.location.href = `/signin?returnUrl=${encodeURIComponent(target)}`;
}

export function startSignOut() {
  window.location.href = "/signout";
}
