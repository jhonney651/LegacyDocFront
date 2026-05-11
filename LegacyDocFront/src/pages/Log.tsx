import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { getDashboardStats, type DashboardStatsResponse } from "../services/api";

type HistoryItem = {
  id: number;
  createdAt: string;
  file: string;
  summary: string;
  status: string;
  pdf_url: string | null;
};

export default function Log() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
        setStatsError(null);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas.";

        setStatsError(message);
      }
    }

    loadStats();
  }, []);

  function loadHistory() {
    try {
      const raw = localStorage.getItem("legacyDocHistory");
      console.log("legacyDocHistory RAW:", raw);

      if (!raw) {
        setHistory([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setHistory(parsed);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setHistory([]);
    }
  }

  useEffect(() => {
    loadHistory();

    const handleStorage = () => loadHistory();
    const handleCustomUpdate = () => loadHistory();
    const handleFocus = () => loadHistory();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("legacydoc-history-updated", handleCustomUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("legacydoc-history-updated", handleCustomUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <h1>Histórico de documentações</h1>
          <p className="hero-subtitle">
            Acompanhe todas as documentações geradas.
          </p>

          <div className="dashboard-grid">
            <div className="card">
              <h3>Total de gerações</h3>
              <p>{stats?.total_generations ?? 0}</p>
            </div>

            <div className="card">
              <h3>Sucessos</h3>
              <p>{stats?.total_success ?? 0}</p>
            </div>

            <div className="card">
              <h3>Erros</h3>
              <p>{stats?.total_errors ?? 0}</p>
            </div>

            <div className="card">
              <h3>PDFs gerados</h3>
              <p>{stats?.total_pdfs ?? 0}</p>
            </div>
          </div>

          {statsError && (
            <p className="error-msg">
              Não foi possível carregar as estatísticas: {statsError}
            </p>
          )}

          <div className="log-list">
            {history.length === 0 ? (
              <div className="log-item">
                <div className="log-left">
                  <strong>Nenhuma análise ainda</strong>
                  <span className="status pending">Sem registros</span>
                </div>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="log-item">
                  <div className="log-left">
                    <strong>{item.file}</strong>

                    <span
                      className={
                        item.status === "success"
                          ? "status success"
                          : "status pending"
                      }
                    >
                      {item.status === "success" ? "Concluído" : item.status}
                    </span>

                    <small
                      style={{
                        marginTop: "8px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.createdAt}
                    </small>

                    <small
                      style={{
                        marginTop: "6px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.summary}
                    </small>
                  </div>

                  {item.pdf_url ? (
                    <a
                      className="btn link-btn"
                      href={
                        item.pdf_url.startsWith("http")
                          ? item.pdf_url
                          : `http://localhost:8000${item.pdf_url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  ) : (
                    <button className="btn" disabled>
                      Sem PDF
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}