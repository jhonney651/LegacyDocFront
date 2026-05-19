import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

type FunctionArg = {
  name: string;
  type: string;
};

type FunctionItem = {
  name: string;
  kind?: string;
  return_type?: string;
  args?: FunctionArg[];
  summary?: string;
  description?: string;
  raises?: string[];
};

type DocumentationObject = {
  file?: string;
  summary?: string;
  functions?: FunctionItem[];
};

type ApiResponse = {
  status?: string;
  file?: string;
  summary?: string;
  documentation?: FunctionItem[] | DocumentationObject;
  pdf_url?: string;
};

export default function Resultado() {
  const navigate = useNavigate();

  const raw = localStorage.getItem("legacyDocResult");
  const result: ApiResponse | null = raw ? JSON.parse(raw) : null;

  const functions: FunctionItem[] = Array.isArray(result?.documentation)
    ? result.documentation
    : result?.documentation?.functions ?? [];

  const fileName =
    result?.file ||
    (!Array.isArray(result?.documentation) && result?.documentation?.file) ||
    "Arquivo analisado";

  const firstFunction = functions[0];

  const summary =
    result?.summary ||
    (!Array.isArray(result?.documentation) && result?.documentation?.summary) ||
    firstFunction?.summary ||
    "Documentação gerada com sucesso.";

  if (!result) {
    return (
      <>
        <Navbar />

        <main className="main-screen">
          <section className="hero">
            <span className="badge">Sem resultado</span>

            <h1>Nenhum resultado encontrado</h1>

            <p className="hero-subtitle">
              Faça uma análise antes de acessar esta página.
            </p>

            <button className="btn" onClick={() => navigate("/")}>
              Voltar
            </button>
          </section>
        </main>
      </>
    );
  }

  const totalFunctions = functions.length;

  const totalArgs = functions.reduce(
    (acc, fn) => acc + (fn.args?.length ?? 0),
    0
  );

  const functionsWithArgs = functions.filter(
    (fn) => (fn.args?.length ?? 0) > 0
  ).length;

  const functionsWithRaises = functions.filter(
    (fn) => (fn.raises?.length ?? 0) > 0
  ).length;

  function handleDownloadPdf() {
    if (!result?.pdf_url) {
      alert("PDF ainda não disponível.");
      return;
    }

    const pdfUrl = result.pdf_url.startsWith("http")
      ? result.pdf_url
      : `http://127.0.0.1:8000${result.pdf_url}`;

    window.open(pdfUrl, "_blank");
  }

  return (
    <>
      <Navbar />

      <main className="dashboard">
        <section className="dashboard-hero">
          <span className="badge">Resultado da análise</span>

          <h1>{fileName}</h1>

          <div className="dashboard-score">{totalFunctions}</div>

          <p>{summary}</p>

          <div className="dashboard-actions">
            <button className="btn" onClick={handleDownloadPdf}>
              Baixar PDF
            </button>

            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Nova análise
            </button>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="card metric-card">
            <h3>📦 Arquivo analisado</h3>
            <p>{fileName}</p>
          </div>

          <div className="card metric-card">
            <h3>🧠 Total de funções</h3>
            <p>{totalFunctions}</p>
          </div>

          <div className="card metric-card">
            <h3>🧾 Total de argumentos</h3>
            <p>{totalArgs}</p>
          </div>

          <div className="card metric-card">
            <h3>🔧 Funções com parâmetros</h3>
            <p>{functionsWithArgs}</p>
          </div>

          <div className="card metric-card">
            <h3>⚠️ Funções com raises</h3>
            <p>{functionsWithRaises}</p>
          </div>

          <div className="card metric-card">
            <h3>📄 Status</h3>
            <p>{result.status ?? "success"}</p>
          </div>
        </section>

        <section className="card dashboard-section">
          <h3>📑 Resumo da documentação</h3>
          <p>{summary}</p>
        </section>

        <section className="card dashboard-section">
          <h3>🧩 Funções analisadas</h3>

          {functions.length === 0 ? (
            <p>Nenhuma função encontrada.</p>
          ) : (
            <div className="functions-list">
              {functions.map((fn, index) => (
                <article key={`${fn.name}-${index}`} className="function-card">
                  <div className="function-header">
                    <div>
                      <h4>{fn.name || "Função sem nome"}</h4>
                      <span>
                        {fn.kind ? `${fn.kind} • ` : ""}
                        {fn.return_type || "Retorno não informado"}
                      </span>
                    </div>

                    <span className="function-badge">
                      {fn.args?.length ?? 0} args
                    </span>
                  </div>

                  <p>
                    <strong>Resumo:</strong>{" "}
                    {fn.summary || "Sem resumo informado."}
                  </p>

                  <p>
                    <strong>Argumentos:</strong>{" "}
                    {fn.args && fn.args.length > 0
                      ? fn.args
                          .map((arg) => `${arg.type} ${arg.name}`)
                          .join(", ")
                      : "Nenhum"}
                  </p>

                  <p>
                    <strong>Raises:</strong>{" "}
                    {fn.raises && fn.raises.length > 0
                      ? fn.raises.join(", ")
                      : "Nenhum"}
                  </p>

                  <p>
                    <strong>Descrição:</strong>{" "}
                    {fn.description || "Sem descrição informada."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}