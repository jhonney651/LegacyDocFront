const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

const AUTH_TOKEN_KEY = "legacyDocToken";

/**
 * A v2 nao gera documentacao dentro da requisicao.
 *
 * O POST devolve 202 com um id em milissegundos e um worker separado faz o
 * trabalho. Na v1 a geracao acontecia dentro do handler, prendia o servidor
 * inteiro por minutos e estourava o timeout do nginx em qualquer repositorio
 * grande. Por isso aqui existe polling em vez de uma unica espera.
 */
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

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
  summary?: string;
  documentation?: FunctionItem[];
  pdf_url?: string;
  markdown_url?: string;
  json_url?: string;
  findings?: FindingItem[];
  findings_locked?: boolean;
  depth?: string;
  documents?: DocumentSummary[];
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
};

export type PlanInfo = {
  tier: string;
  display_name: string;
  monthly_job_quota: number;
  monthly_cost_limit_usd: number;
  max_files_per_job: number;
  max_concurrent_jobs: number;
  features: string[];
  max_depth: string;
  available_depths: string[];
};

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string | null;
  plan: PlanInfo;
  jobs_used_this_month: number;
  spent_this_month_usd: number;

  /**
   * Se esta conta abre o painel.
   *
   * Serve para não oferecer uma porta que a pessoa vai bater e receber 404.
   * Esconder o link não é controle de acesso: o painel recusa por conta
   * própria quem não for administrador.
   */
  is_admin: boolean;
};

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type Job = {
  id: string;
  job_type: string;
  status: JobStatus;
  progress_percent: number;
  progress_message: string | null;
  error_code: string | null;
  error_message: string | null;
  document_count: number;
  depth: string;
  project_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;

  /** O que foi analisado: URL do repositório, nome do .zip ou caminho. */
  source: string | null;
};

export type JobList = {
  items: Job[];
  total: number;
};

export type DocumentSummary = {
  id: string;
  job_id: string;
  path: string;
  language: string;
  summary: string | null;
  symbol_count: number;
  finding_count: number;
  depth: string;
};

export type SymbolDoc = {
  name: string;
  kind: string;
  signature: string;
  language: string;
  line_start: number;
  line_end: number;
  summary: string;
  description: string;
  parameters: { name: string; type: string | null; description: string }[];
  return_type: string | null;
  return_description: string | null;
  raises: string[];
  side_effects: string[];
  complexity_estimate: number | null;
  parent: string | null;
};

export type FindingItem = {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
  suggestion: string | null;
  symbol_name: string | null;
  line_start: number | null;
  line_end: number | null;
  confidence: number;
};

export type DocumentDetail = {
  id: string;
  job_id: string;
  path: string;
  language: string;
  summary: string | null;
  symbols: SymbolDoc[];
  findings: FindingItem[];
  findings_locked: boolean;
  depth: string;
};

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  // Entrar tambem limpa. Sair com a aba fechada, expirar a sessao ou trocar de
  // conta sem passar pelo botao de sair sao caminhos reais, e em todos eles o
  // que ficou no navegador nao pertence a quem esta entrando agora.
  clearLocalSession();

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event("legacydoc-auth-updated"));
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);

  // Sair tem de levar junto o que a sessão deixou na maquina. Apagar so o
  // token deixava o ultimo resultado e a URL analisada visiveis para a
  // proxima pessoa que entrasse neste navegador.
  clearLocalSession();

  window.dispatchEvent(new Event("legacydoc-auth-updated"));
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Traduz o envelope de erro da v2 para uma mensagem utilizavel.
 *
 * A v1 respondia toda falha com a mesma mensagem opaca, entao o cliente nao
 * distinguia cota esgotada de repositorio invalido. A v2 responde sempre com
 * `{error, message, details}`, e e a `message` que a tela deve mostrar.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.detail || data?.error || "Erro na API";

    throw new Error(message);
  }

  return data as T;
}

async function get<T>(path: string): Promise<T> {
  return handleResponse<T>(
    await fetch(`${API_BASE_URL}${path}`, { headers: getAuthHeaders() })
  );
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(
    await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    })
  );
}

// ------------------------------------------------------------------ auth

export async function login(email: string, password: string) {
  return post<AuthResponse>("/v1/auth/login", { email, password });
}

export async function register(email: string, password: string) {
  return post<AuthResponse>("/v1/auth/register", { email, password });
}

export async function getCurrentUser() {
  return get<CurrentUser>("/v1/auth/me");
}

export async function requestPasswordReset(email: string) {
  return post<{ message: string }>("/v1/auth/password-reset/request", { email });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  return post<AuthResponse>("/v1/auth/password-reset/confirm", {
    token,
    new_password: newPassword,
  });
}

// ------------------------------------------------------------------ jobs

export async function createRepositoryJob(params: {
  repoUrl: string;
  branch?: string | null;
  paths?: string[];
  depth?: string | null;
  projectId?: string | null;
}) {
  return post<Job>("/v1/jobs", {
    job_type: "document_repository",
    repo_url: params.repoUrl,
    branch: params.branch || null,
    paths: params.paths ?? [],
    depth: params.depth || null,
    project_id: params.projectId || null,
    output_language: "pt-BR",
  });
}

export async function getJob(jobId: string) {
  return get<Job>(`/v1/jobs/${jobId}`);
}

/**
 * Histórico da conta que está autenticada agora.
 *
 * A lista vem do servidor, e não do navegador. O histórico costumava morar em
 * `localStorage`, o que parecia inofensivo e não era: nada ali é vinculado a
 * uma conta, então quem entrasse depois no mesmo navegador via as análises de
 * quem entrou antes. O servidor filtra por dono, então pedir a ele elimina a
 * classe inteira do problema em vez de remendar caso a caso.
 */
export async function listJobs(limit = 50) {
  return get<JobList>(`/v1/jobs?limit=${limit}`);
}

/** Apaga tudo que a sessão anterior deixou no navegador. */
export function clearLocalSession() {
  for (const chave of [
    "legacyDocResult",
    "legacyDocHistory",
    "repoUrl",
    "repoBranch",
    "repoDepth",
    "pendingJobId",
  ]) {
    localStorage.removeItem(chave);
  }
}

export async function listDocuments(jobId: string) {
  return get<DocumentSummary[]>(`/v1/documents?job_id=${jobId}`);
}

export async function getDocument(documentId: string) {
  return get<DocumentDetail>(`/v1/documents/${documentId}`);
}

export function exportPath(documentId: string, format: string) {
  return `/v1/documents/${documentId}/export?format=${format}`;
}

const TERMINAL: JobStatus[] = ["succeeded", "failed", "cancelled"];

/** Acompanha o job ate ele terminar, informando o progresso pelo caminho. */
export async function waitForJob(
  jobId: string,
  onProgress?: (job: Job) => void
): Promise<Job> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  for (;;) {
    const job = await getJob(jobId);

    onProgress?.(job);

    if (TERMINAL.includes(job.status)) {
      return job;
    }

    if (Date.now() > deadline) {
      throw new Error(
        "O processamento passou do tempo previsto. Consulte o job mais tarde."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// ------------------------------------------------------------- traducao

/**
 * Converte um documento da v2 no formato que a tela de resultado ja desenha.
 *
 * A v2 descreve simbolos, onde a v1 descrevia funcoes soltas; a diferenca que
 * importa para a tela e que agora existem linhas, complexidade e classe-mae,
 * todas vindas do parser e nao do modelo.
 */
function toFunctionItems(symbols: SymbolDoc[]): FunctionItem[] {
  return symbols.map((symbol) => ({
    name: symbol.parent ? `${symbol.parent}.${symbol.name}` : symbol.name,
    kind: symbol.kind,
    signature: symbol.signature,
    return_type: symbol.return_type ?? undefined,
    args: symbol.parameters.map((parameter) => ({
      name: parameter.name,
      type: parameter.type ?? "?",
    })),
    summary: symbol.summary,
    description: symbol.description,
    raises: symbol.raises,
  }));
}

/** Empacota um documento no formato que a tela de resultado desenha. */
export function documentToResult(
  detail: DocumentDetail,
  documents: DocumentSummary[]
): GenerateResponse {
  return {
    status: "success",
    file: detail.path,
    summary: detail.summary ?? undefined,
    documentation: toFunctionItems(detail.symbols),
    findings: detail.findings,
    findings_locked: detail.findings_locked,
    depth: detail.depth,
    documents,
    pdf_url: exportPath(detail.id, "pdf"),
    markdown_url: exportPath(detail.id, "markdown"),
    json_url: exportPath(detail.id, "json"),
  };
}

/**
 * Acompanha um job que já existe e devolve o primeiro documento pronto.
 *
 * Separado da criação de propósito: o job pode nascer de três jeitos, por link,
 * por envio de arquivo ou pela extensão, e o resto do caminho é idêntico. Quem
 * envia arquivo cria o job na tela de origem, onde há barra de envio, e a tela
 * de carregamento só acompanha.
 *
 * Um job rende um documento por arquivo. A lista inteira vai em `documents`, que
 * e por onde a tela troca de arquivo; os demais campos trazem o primeiro ja
 * aberto, para a tela ter o que mostrar sem uma segunda espera.
 */
export async function followJob(
  jobId: string,
  onProgress?: (job: Job) => void
): Promise<GenerateResponse> {
  const finished = await waitForJob(jobId, onProgress);

  if (finished.status !== "succeeded") {
    throw new Error(
      finished.error_message ||
        "O processamento falhou. Tente novamente em alguns minutos."
    );
  }

  const documents = await listDocuments(finished.id);

  if (documents.length === 0) {
    throw new Error(
      "Nenhum arquivo suportado foi encontrado no material enviado."
    );
  }

  return documentToResult(await getDocument(documents[0].id), documents);
}

/** Fluxo por link: enfileira e acompanha. */
export async function runRepositoryJob(
  params: {
    repoUrl: string;
    branch?: string | null;
    paths?: string[];
    depth?: string | null;
  },
  onProgress?: (job: Job) => void
): Promise<GenerateResponse> {
  const created = await createRepositoryJob(params);

  return followJob(created.id, onProgress);
}

// ---------------------------------------------------------------- envio

export type Language = {
  name: string;
  display_name: string;
  extensions: string[];
};

/**
 * Linguagens que o servidor documenta. Pública: nao exige login.
 *
 * O front filtra o que envia com esta lista, e nao com uma copia fixa, para uma
 * linguagem nova no servidor passar a valer sem mexer aqui.
 */
export async function getLanguages() {
  return get<Language[]>("/v1/meta/languages");
}

/**
 * Envia um .zip e devolve o job criado.
 *
 * XMLHttpRequest e nao fetch porque so ele informa o progresso do ENVIO. Subir
 * dezenas de megabytes sem nenhum sinal parece travamento, e a pessoa fecha a
 * aba. O `Content-Type` fica por conta do navegador: ele precisa gerar o
 * separador do multipart, e fixar o cabecalho na mao quebra o envio.
 */
export function createUploadJob(
  file: File,
  depth: string | null,
  onProgress?: (percent: number) => void
): Promise<Job> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("output_language", "pt-BR");

    // Omitido, e nao enviado vazio: a API valida o campo como enumeracao, e
    // string vazia e recusada com 422.
    if (depth) form.append("depth", depth);

    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/v1/jobs/upload`);

    const token = getAuthToken();
    if (token) request.setRequestHeader("Authorization", `Bearer ${token}`);

    request.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        onProgress?.(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    request.onerror = () =>
      reject(new Error("Não foi possível enviar o arquivo. Verifique sua conexão."));

    request.onload = () => {
      let corpo: { message?: string } | null = null;

      try {
        corpo = JSON.parse(request.responseText);
      } catch {
        // Resposta que nao e JSON: vem do proxy, nao da aplicacao.
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(corpo as unknown as Job);
        return;
      }

      if (request.status === 401) clearAuthToken();

      reject(
        new Error(
          request.status === 413
            ? "O arquivo passa do limite de 50 MB."
            : corpo?.message || "Não foi possível enviar o arquivo."
        )
      );
    };

    request.send(form);
  });
}

// ----------------------------------------------------------------- painel

export type AdminAccount = {
  id: string;
  email: string;
  display_name: string | null;
  plan_tier: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;

  jobs_this_month: number;
  spent_this_month_usd: number;
  cost_limit_usd: number;
  documents_total: number;
  last_job_at: string | null;
  locked_until: string | null;
};

export type AdminAccountList = {
  items: AdminAccount[];
  total: number;
};

export type AdminAction = {
  id: string;
  actor_email: string;
  target_email: string;
  action: string;
  value_before: string | null;
  value_after: string | null;
  reason: string;
  created_at: string;
};

export async function listAccounts(search = "", limit = 50) {
  const busca = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";

  return get<AdminAccountList>(`/v1/admin/accounts?limit=${limit}${busca}`);
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(
    await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    })
  );
}

/** O motivo é obrigatório: a API recusa sem ele, e com razão. */
export async function changeAccountPlan(userId: string, plan: string, reason: string) {
  return patch<AdminAccount>(`/v1/admin/accounts/${userId}/plan`, { plan, reason });
}

export async function changeAccountStatus(
  userId: string,
  isActive: boolean,
  reason: string
) {
  return patch<AdminAccount>(`/v1/admin/accounts/${userId}/status`, {
    is_active: isActive,
    reason,
  });
}

export async function listAudit(limit = 100) {
  return get<AdminAction[]>(`/v1/admin/audit?limit=${limit}`);
}

export function resolveBackendUrl(path?: string | null) {
  if (!path) return null;

  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

/**
 * Baixa um artefato gerado (PDF, Markdown, JSON).
 *
 * Os arquivos nao sao mais servidos por URL publica: a v1 montava as pastas de
 * saida com `StaticFiles` e nomes previsiveis, entao qualquer um baixava a
 * documentacao de qualquer cliente adivinhando o nome. Agora o artefato e
 * renderizado sob demanda e exige o header Authorization. Como `window.open`
 * nao envia headers, o conteudo vem por fetch e o download sai de um blob.
 */
export async function downloadArtifact(path?: string | null, fallbackName = "documento") {
  const url = resolveBackendUrl(path);

  if (!url) {
    throw new Error("Arquivo nao disponivel.");
  }

  const response = await fetch(url, { headers: getAuthHeaders() });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sessao expirada. Entre novamente para baixar o arquivo.");
    }
    throw new Error("Nao foi possivel baixar o arquivo.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  // O nome vem do Content-Disposition da API; este e so o reserva.
  link.href = objectUrl;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Sem isto o blob fica retido na memoria da aba ate o reload.
  URL.revokeObjectURL(objectUrl);
}
