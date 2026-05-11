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

type ApiResponse = {
  status?: string;
  file?: string;
  documentation?: FunctionItem[];
  pdf_url?: string;
};

export default function Resultado() {
  const navigate = useNavigate();

  const raw = localStorage.getItem("analysisResult");
  const result: ApiResponse | null = raw ? JSON.parse(raw) : null;

  if (!result) {
    return (
      <>
        <Navbar />

        <main className="main-screen">
          <section className="hero">
            <span className="badge">Sem resultado</span>

            <h1>Nenhuma análise encontrada</h1>

            <p className="hero-subtitle">
              Faça uma nova análise para visualizar o dashboard.
            </p>

            <div className="actions">
              <button className="btn" onClick={() => navigate("/")}>
                Voltar para início
              </button>
            </div>
          </section>
        </main>
      </>
    );
  }

  const functions = Array.isArray(result.documentation)
    ? result.documentation
    : [];

  const totalFunctions = functions.length;

  const totalArgs = functions.reduce((acc, fn) => {
    return acc + (Array.isArray(fn.args) ? fn.args.length : 0);
  }, 0);

  const functionsWithArgs = functions.filter((fn) => {
    return Array.isArray(fn.args) && fn.args.length > 0;
  }).length;

  const functionsWithRaises = functions.filter((fn) => {
    return Array.isArray(fn.raises) && fn.raises.length > 0;
  }).length;

  const fileName = result.file ?? "Arquivo não informado";

  const fileSummary =
    totalFunctions > 0
      ? `Foram analisadas ${totalFunctions} funções no arquivo ${fileName}.`
      : `Nenhuma função foi encontrada no arquivo ${fileName}.`;

  const pdfUrl = result.pdf_url;

  function handleDownloadPdf() {
    if (!pdfUrl) {
      alert("PDF ainda não disponível.");
      return;
    }

    const finalUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `http://localhost:8000${pdfUrl}`;

    window.open(finalUrl, "_blank");
  }

  return (
    <>
      <Navbar />

      <main className="dashboard">
        <div className="resultado-header">
          <div className="score-box">
            <h2>{fileName}</h2>

            <div className="score">{totalFunctions}</div>

            <p>{fileSummary}</p>
          </div>

          <div className="resultado-actions">
            <button className="btn" onClick={handleDownloadPdf}>
              Baixar PDF
            </button>

            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Nova análise
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>📦 Arquivo analisado</h3>
            <p>{fileName}</p>
          </div>

          <div className="card">
            <h3>🧠 Total de funções</h3>
            <p>{totalFunctions}</p>
          </div>

          <div className="card">
            <h3>🧾 Total de argumentos</h3>
            <p>{totalArgs}</p>
          </div>

          <div className="card">
            <h3>🔧 Funções com parâmetros</h3>
            <p>{functionsWithArgs}</p>
          </div>

          <div className="card">
            <h3>⚠️ Funções com raises</h3>
            <p>{functionsWithRaises}</p>
          </div>

          <div className="card">
            <h3>📄 Status</h3>
            <p>{result.status ?? "success"}</p>
          </div>
        </div>

        <div className="card section-card">
          <h3>📄 Resumo do arquivo</h3>
          <p className="section-text">{fileSummary}</p>
        </div>

        <div className="card section-card">
          <h3>🧩 Funções analisadas</h3>

          <div className="functions-list">
            {functions.length === 0 ? (
              <p className="section-text">
                Nenhuma função foi encontrada na resposta da API.
              </p>
            ) : (
              functions.map((fn, index) => (
                <div key={`${fn.name}-${index}`} className="function-card">
                  <div className="function-card-top">
                    <h4>{fn.name ?? "Função sem nome"}</h4>

                    <span className="function-badge">
                      {fn.return_type ?? "Sem tipo"}
                    </span>
                  </div>

                  <p>
                    <strong>Resumo:</strong>{" "}
                    {fn.summary ?? "Resumo não informado."}
                  </p>

                  <p>
                    <strong>Tipo:</strong> {fn.kind ?? "function"}
                  </p>

                  <p>
                    <strong>Argumentos:</strong>{" "}
                    {Array.isArray(fn.args) && fn.args.length > 0
                      ? fn.args
                          .map((arg) => `${arg.type} ${arg.name}`)
                          .join(", ")
                      : "Nenhum"}
                  </p>

                  <p>
                    <strong>Raises:</strong>{" "}
                    {Array.isArray(fn.raises) && fn.raises.length > 0
                      ? fn.raises.join(", ")
                      : "Nenhum"}
                  </p>

                  <p>
                    <strong>Descrição:</strong>{" "}
                    {fn.description ?? "Descrição não informada."}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}