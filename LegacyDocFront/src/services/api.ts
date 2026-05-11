const API_BASE_URL = "http://localhost:8000";

export type GenerateRequest = {
  github_url: string;
  file_path: string;
};

export type GenerateResponse = {
  status?: string;
  file?: string;
  documentation?: {
    file: string;
    summary: string;
    functions: {
      name: string;
      return_type: string;
      args: {
        name: string;
        type: string;
      }[];
      summary: string;
      description: string;
      raises: string[];
    }[];
  };
  pdf_url?: string;
  error?: string;
  message?: string;
};

export type DashboardStatsResponse = {
  total_generations?: number;
  total_success?: number;
  total_errors?: number;
  total_pdfs?: number;
  [key: string]: unknown;
};

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

export async function generateDocumentation(
  payload: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<GenerateResponse>(response);
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    method: "GET",
  });

  return handleResponse<DashboardStatsResponse>(response);
}

export function resolveBackendUrl(path?: string | null) {
  if (!path) return null;

  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}