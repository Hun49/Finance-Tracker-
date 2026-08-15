const envApiUrl = process.env.NEXT_PUBLIC_API_URL;

function resolveApiBaseUrl(): string {
  if (envApiUrl) return envApiUrl;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return "http://localhost:4000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export function getStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export function storeTokens(tokens: StoredTokens) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export class ApiError extends Error {
  status: number;
  issues?: unknown;

  constructor(status: number, message: string, issues?: unknown) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const data = await response.json();
  storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken as string;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = getStoredTokens();
  const headers = new Headers(options.headers);

  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (tokens) headers.set("Authorization", `Bearer ${tokens.accessToken}`);

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && tokens) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!response.ok) {
    let message = "Request failed";
    let issues: unknown;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
      issues = body.issues;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message, issues);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function apiBody(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

export const jsonPost = (body: unknown): RequestInit => ({
  method: "POST",
  ...apiBody(body),
});

export const jsonPatch = (body: unknown): RequestInit => ({
  method: "PATCH",
  ...apiBody(body),
});