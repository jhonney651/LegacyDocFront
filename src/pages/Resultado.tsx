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
  markdown_url?: string;
};

function getRepoName(repoUrl: string | null) {
  if (!repoUrl) return "Repositório não informado";

  const clean = repoUrl.replace(".git", "");
  const parts = clean.split("/").filter(Boolean);

  return parts[parts.length - 1] || "Repositório analisado";
}

function getLanguageByFile(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".cpp") || lower.endsWith(".c") || lower.endsWith(".h")) {
    return "C / C++";
  }

  if (lower.endsWith(".py")) return "Python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "TypeScript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "JavaScript";
  if (lower.endsWith(".java")) return "Java";
  if (lower.endsWith(".cs")) return "C#";

  return "Não identificada";
}

function getStackByLanguage(language: string) {
  if (language.includes("C")) {
    return ["C/C++", "Funções", "Headers", "Compilação nativa", "Entrada/Saída"];
  }

  if (language === "Python") {
    return ["Python", "Módulos", "Funções", "Scripts", "Automação"];
  }

  if (language === "TypeScript") {
    return ["TypeScript", "React", "Componentes", "Services", "Vite"];
  }

  if (language === "JavaScript") {
    return ["JavaScript", "Node.js", "Funções", "Módulos", "Frontend"];
  }

  return ["Código-fonte", "Funções", "Estrutura", "Documentação", "Análise"];
}

export default function Resultado() {
  const navigate = useNavigate();

  const raw = localStorage.getItem("legacyDocResult");
  const repoUrl = localStorage.getItem("repoUrl");

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
    "Documentação gerada automaticamente com base na análise do repositório.";

  const repoName = getRepoName(repoUrl);
  const language = getLanguageByFile(fileName);
  const stack = getStackByLanguage(language);

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

  const qualityScore = Math.max(
    65,
    Math.min(96, 88 - functionsWithRaises * 4 + functionsWithArgs * 2)
  );

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

  function handleDownloadMD() {
    if (!result?.markdown_url) {
      alert("Markdown não disponível para este item.");
      return;
    }
    const markdownUrl = result.markdown_url.startsWith("http")
      ? result.markdown_url
      : `http://127.0.0.1:8000${result.markdown_url}`;

    window.open(markdownUrl, "_blank");
  }

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

  return (
    <>
      <Navbar />

      <main className="result-page">
        <section className="report-paper">
          <header className="report-header">
            <div className="report-brand">
            <img src="\src\assets\logo.png" alt="Legacy Doc" className="report-logo-img" />
            </div>

            <div className="report-generated">
              <span>GERADO AUTOMATICAMENTE</span>
              <strong>{new Date().toLocaleString("pt-BR")}</strong>
            </div>
          </header>

          <section className="report-hero">
            <div className="report-title-block">
              <span className="report-kicker">DOCUMENTAÇÃO TÉCNICA</span>

              <h1>Documentação Técnica Automatizada</h1>

              <p>
                Visão técnica completa e organizada do projeto, gerada
                automaticamente a partir da análise do código-fonte.
              </p>

              <div className="report-actions">
                <button className="btn" onClick={handleDownloadPdf}>
                  Baixar PDF
                </button>

                <button className="btn" onClick={handleDownloadMD}>
                  Baixar Markdown
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/")}
                >
                  Nova análise
                </button>
              </div>
            </div>

            <aside className="repo-info-card">
              <div className="section-heading compact">
                <span>▣</span>
                <h2>Repositório</h2>
              </div>

              <div className="repo-row">
                <span>Projeto</span>
                <strong>{repoName}</strong>
              </div>

              <div className="repo-row">
                <span>URL</span>
                <strong>{repoUrl || "Não informado"}</strong>
              </div>

              <div className="repo-row">
                <span>Arquivo</span>
                <strong>{fileName}</strong>
              </div>

              <div className="repo-row">
                <span>Linguagem</span>
                <strong>{language}</strong>
              </div>

              <div className="repo-row">
                <span>Status</span>
                <strong className="success-text">
                  {result.status || "success"}
                </strong>
              </div>
            </aside>
          </section>

          <div className="report-divider"></div>

          <section className="report-two-columns">
            <div className="stack-card">
              <div className="section-heading">
                <span>▤</span>
                <h2>Stack tecnológica</h2>
              </div>

              <div className="stack-list">
                {stack.map((item, index) => (
                  <div className="stack-item" key={item}>
                    <span className="stack-icon">{index + 1}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="architecture-card">
              <div className="section-heading">
                <span>⌘</span>
                <h2>Visão geral da análise</h2>
              </div>

              <div className="architecture-flow">
                <div className="arch-node">Repositório</div>
                <div className="arch-arrow">→</div>
                <div className="arch-node">Arquivo</div>
                <div className="arch-arrow">→</div>
                <div className="arch-node">Funções</div>
                <div className="arch-arrow">→</div>
                <div className="arch-node">Documentação</div>
              </div>

              <p>
                O Legacy Doc analisa o código-fonte, identifica estruturas
                relevantes e transforma o conteúdo técnico em documentação
                organizada.
              </p>
            </div>
          </section>

          <section className="metrics-row">
            <div className="report-metric">
              <span>ƒx</span>
              <p>Funções detectadas</p>
              <strong>{totalFunctions}</strong>
            </div>

            <div className="report-metric">
              <span>◌</span>
              <p>Argumentos totais</p>
              <strong>{totalArgs}</strong>
            </div>

            <div className="report-metric">
              <span>&lt;/&gt;</span>
              <p>Linguagem</p>
              <strong>{language}</strong>
            </div>

            <div className="report-metric">
              <span>★</span>
              <p>Qualidade estrutural</p>
              <strong>{qualityScore}%</strong>
            </div>
          </section>

          <section className="report-grid-bottom">
            <div className="code-insight-card">
              <div className="section-heading">
                <span>&lt;/&gt;</span>
                <h2>Insights de código</h2>
              </div>

              <div className="code-window">
                <pre>
{`arquivo: ${fileName}
funções: ${totalFunctions}
argumentos: ${totalArgs}
linguagem: ${language}
status: ${result.status || "success"}`}
                </pre>
              </div>

              <div className="info-note">
                A análise identificou estruturas documentáveis e transformou os
                principais elementos técnicos em informação legível.
              </div>
            </div>

            <div className="improvements-card">
              <div className="section-heading">
                <span>⚠</span>
                <h2>Avisos e melhorias</h2>
              </div>

              <div className="improvement-list">
                <div className="improvement-item high">
                  <strong>Documentação automatizada</strong>
                  <p>
                    Revise os textos gerados para ajustar termos específicos do
                    projeto.
                  </p>
                  <span>Médio</span>
                </div>

                <div className="improvement-item medium">
                  <strong>Funções com parâmetros</strong>
                  <p>
                    {functionsWithArgs} função(ões) possuem argumentos e podem
                    exigir explicação mais detalhada.
                  </p>
                  <span>Info</span>
                </div>

                <div className="improvement-item low">
                  <strong>Boas práticas</strong>
                  <p>
                    A documentação criada pode servir como base para manutenção
                    e onboarding técnico.
                  </p>
                  <span>Ok</span>
                </div>
              </div>
            </div>

            <div className="modules-card">
              <div className="section-heading">
                <span>▦</span>
                <h2>Resumo do projeto</h2>
              </div>

              <div className="project-summary-list">
                <div>
                  <span>Arquivo analisado</span>
                  <strong>{fileName}</strong>
                </div>

                <div>
                  <span>Funções</span>
                  <strong>{totalFunctions}</strong>
                </div>

                <div>
                  <span>Com parâmetros</span>
                  <strong>{functionsWithArgs}</strong>
                </div>

                <div>
                  <span>Com raises</span>
                  <strong>{functionsWithRaises}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{result.status || "success"}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="documented-functions">
            <div className="section-heading">
              <span>☰</span>
              <h2>Funções documentadas</h2>
            </div>

            {functions.length === 0 ? (
              <p className="empty-text">Nenhuma função encontrada.</p>
            ) : (
              <div className="function-report-list">
                {functions.map((fn, index) => (
                  <article
                    className="function-report-card"
                    key={`${fn.name}-${index}`}
                  >
                    <div className="function-report-header">
                      <div>
                        <span>Função</span>
                        <h3>{fn.name || "Função sem nome"}</h3>
                      </div>

                      <strong>{fn.return_type || "Retorno não informado"}</strong>
                    </div>

                    <div className="function-report-content">
                      <div>
                        <small>Tipo</small>
                        <p>{fn.kind || "function"}</p>
                      </div>

                      <div>
                        <small>Resumo</small>
                        <p>{fn.summary || "Sem resumo informado."}</p>
                      </div>

                      <div>
                        <small>Parâmetros</small>
                        <p>
                          {fn.args && fn.args.length > 0
                            ? fn.args
                                .map((arg) => `${arg.name} (${arg.type})`)
                                .join(", ")
                            : "Nenhum"}
                        </p>
                      </div>

                      <div>
                        <small>Descrição</small>
                        <p>{fn.description || "Sem descrição informada."}</p>
                      </div>

                      <div>
                        <small>Raises</small>
                        <p>
                          {fn.raises && fn.raises.length > 0
                            ? fn.raises.join(", ")
                            : "Nenhum"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="report-observation">
            <strong>Observações</strong>
            <p>
              A documentação foi gerada automaticamente com base na análise do
              repositório e pode servir como apoio técnico, educacional e de
              manutenção.
            </p>
          </section>

          <footer className="report-footer">
            <strong>LEGACY DOC</strong>
            <span>Conhecimento que conecta.</span>
            <p>Página de resultado</p>
          </footer>
        </section>
      </main>
    </>
  );
}