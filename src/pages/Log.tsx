import Navbar from "../components/Navbar";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  documentToResult,
  downloadArtifact,
  exportPath,
  getAuthToken,
  getDocument,
  listDocuments,
  listJobs,
  type Job,
} from "../services/api";

const ROTULO_DE_STATUS: Record<string, string> = {
  queued: "Na fila",
  running: "Processando",
  succeeded: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const ROTULO_DE_NIVEL: Record<string, string> = {
  basic: "Básico",
  standard: "Padrão",
  pro: "Completo",
};

function classeDeStatus(status: string) {
  if (status === "succeeded") return "status success";
  if (status === "failed" || status === "cancelled") return "status error";
  return "status pending";
}

function formatarData(iso: string) {
  const data = new Date(iso);
  return Number.isNaN(data.valueOf()) ? iso : data.toLocaleString("pt-BR");
}

export default function Log() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);

  /**
   * O histórico vem do servidor, e não do navegador.
   *
   * Ele morava em `localStorage`, o que parecia inofensivo e não era: nada ali
   * é vinculado a uma conta, então quem entrasse depois no mesmo navegador via
   * as análises de quem entrou antes. O servidor filtra por dono, então pedir a
   * ele resolve a classe inteira do problema em vez de remendar caso a caso.
   */
  const carregar = useCallback(async () => {
    if (!getAuthToken()) {
      navigate("/login", { viewTransition: true });
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const lista = await listJobs();
      setJobs(lista.items);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível carregar o histórico."
      );
    } finally {
      setCarregando(false);
    }
  }, [navigate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Busca os documentos do job e abre o primeiro. */
  async function abrirResultado(job: Job) {
    if (abrindo) return;

    setAbrindo(job.id);

    try {
      const documentos = await listDocuments(job.id);

      if (documentos.length === 0) {
        alert("Esta análise não gerou nenhum documento.");
        return;
      }

      const detalhe = await getDocument(documentos[0].id);

      localStorage.setItem(
        "legacyDocResult",
        JSON.stringify(documentToResult(detalhe, documentos))
      );

      const origem = (job as Job & { params?: { repo_url?: string } }).params?.repo_url;
      if (origem) localStorage.setItem("repoUrl", origem);

      navigate("/resultado", { viewTransition: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível abrir o resultado.");
    } finally {
      setAbrindo(null);
    }
  }

  async function baixar(job: Job, formato: "pdf" | "markdown") {
    try {
      const documentos = await listDocuments(job.id);

      if (documentos.length === 0) {
        alert("Esta análise não gerou nenhum documento.");
        return;
      }

      await downloadArtifact(
        exportPath(documentos[0].id, formato),
        formato === "pdf" ? "documentacao.pdf" : "documentacao.md"
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Falha ao baixar o arquivo.");
    }
  }

  return (
    <>
      <Navbar />

      <main id="conteudo" className="main-screen">
        <section className="hero">
          <span className="badge">Histórico</span>

          <h1>Histórico de documentações</h1>

          <p className="hero-subtitle">
            Todas as análises desta conta, em qualquer navegador.
          </p>

          <button className="btn btn-secondary" onClick={carregar} disabled={carregando}>
            {carregando ? "Carregando..." : "Atualizar"}
          </button>

          <div className="log-list">
            {erro && (
              <div className="log-item empty-history">
                <div className="log-left">
                  <strong>Não foi possível carregar</strong>
                  <p>{erro}</p>
                </div>
              </div>
            )}

            {!erro && !carregando && jobs.length === 0 && (
              <div className="log-item empty-history">
                <div className="log-left">
                  <strong>Nenhuma análise ainda</strong>
                  <span className="status pending">Sem registros</span>
                </div>
              </div>
            )}

            {jobs.map((job) => (
              <article className="log-item" key={job.id}>
                <div className="log-left">
                  <strong className="mono">
                    {job.document_count} arquivo(s) documentado(s)
                  </strong>

                  <span className={classeDeStatus(job.status)}>
                    {ROTULO_DE_STATUS[job.status] ?? job.status}
                  </span>

                  <small>{formatarData(job.created_at)}</small>
                  <small>Nível: {ROTULO_DE_NIVEL[job.depth] ?? job.depth}</small>

                  {job.error_message && <p>{job.error_message}</p>}
                </div>

                <div className="log-actions">
                  <button
                    className="btn btn-secondary"
                    disabled={job.document_count === 0 || abrindo === job.id}
                    onClick={() => abrirResultado(job)}
                  >
                    {abrindo === job.id ? "Abrindo..." : "Resultado"}
                  </button>

                  <button
                    className="btn"
                    disabled={job.document_count === 0}
                    onClick={() => baixar(job, "pdf")}
                  >
                    PDF
                  </button>

                  <button
                    className="btn"
                    disabled={job.document_count === 0}
                    onClick={() => baixar(job, "markdown")}
                  >
                    Markdown
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
