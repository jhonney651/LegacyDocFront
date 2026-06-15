const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

const AUTH_TOKEN_KEY = "legacyDocToken";

export type GenerateRequest = {
  github_url: string;
  file_path: string;
};

export type FunctionArg = {
  name: string;
  type: string;
};

export type FunctionItem = {
  name: string;
  kind?: string;
  signature?: string;
  return_type?: string;
  args?: FunctionArg[];
  summary?: string;
  description?: string;
  raises?: string[];
};

export type GenerateResponse = {
  status?: string;
  file?: string;
  documentation?: FunctionItem[];
  pdf_url?: string;
  markdown_url?: string;
  json_url?: string;
  error?: string;
  message?: string;
};

export type DashboardStatsResponse = {
  total_modules?: number;
  modules?: unknown[];
  [key: string]: unknown;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type CurrentUser = {
  id: number;
  email: string;
};

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event("legacydoc-auth-updated"));
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event("legacydoc-auth-updated"));
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.detail || data?.error || data?.message || "Erro na API";

    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<CurrentUser>(response);
}

export async function generateDocumentation(
  payload: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<GenerateResponse>(response);
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<DashboardStatsResponse>(response);
}

export function resolveBackendUrl(path?: string | null) {
  if (!path) return null;

  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}
