import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";

type HistoryItem = {
  id: number;
  createdAt: string;
  repo_url?: string;
  file: string;
  summary: string;
  status: string;
  pdf_url: string | null;
  total_functions?: number;
};

export default function Log() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function loadHistory() {
    try {
      const raw = localStorage.getItem("legacyDocHistory");

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

    window.addEventListener("storage", loadHistory);
    window.addEventListener("legacydoc-history-updated", loadHistory);
    window.addEventListener("focus", loadHistory);

    return () => {
      window.removeEventListener("storage", loadHistory);
      window.removeEventListener("legacydoc-history-updated", loadHistory);
      window.removeEventListener("focus", loadHistory);
    };
  }, []);

  function handleClearHistory() {
    const confirmClear = confirm("Deseja limpar todo o histórico?");

    if (!confirmClear) return;

    localStorage.removeItem("legacyDocHistory");
    setHistory([]);
  }

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <h1>Histórico de documentações</h1>

          <p className="hero-subtitle">
            Acompanhe todas as documentações geradas.
          </p>

          {history.length > 0 && (
            <button className="btn btn-secondary" onClick={handleClearHistory}>
              Limpar histórico
            </button>
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

                    {item.repo_url && (
                      <small
                        style={{
                          marginTop: "6px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Repositório: {item.repo_url}
                      </small>
                    )}

                    <small
                      style={{
                        marginTop: "6px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Funções: {item.total_functions ?? 0}
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
                          : `http://127.0.0.1:8000${item.pdf_url}`
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