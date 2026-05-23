import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type HistoryItem = {
  id: number;
  createdAt: string;
  repo_url?: string;
  file: string;
  summary: string;
  status: string;
  pdf_url?: string | null;
  total_functions?: number;
  resultData?: unknown;
};

export default function Log() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function loadHistory() {
    const raw = localStorage.getItem("legacyDocHistory");
    const parsed = raw ? JSON.parse(raw) : [];
    setHistory(parsed);
  }

  useEffect(() => {
    loadHistory();

    function handleUpdate() {
      loadHistory();
    }

    window.addEventListener("legacydoc-history-updated", handleUpdate);

    return () => {
      window.removeEventListener("legacydoc-history-updated", handleUpdate);
    };
  }, []);

  function handleClearHistory() {
    const confirmClear = confirm("Tem certeza que deseja limpar o histórico?");

    if (!confirmClear) return;

    localStorage.removeItem("legacyDocHistory");
    setHistory([]);
  }

  function handleViewResult(item: HistoryItem) {
    if (item.resultData) {
      localStorage.setItem("legacyDocResult", JSON.stringify(item.resultData));
    } else {
      const fallbackResult = {
        status: item.status || "success",
        file: item.file,
        summary: item.summary,
        pdf_url: item.pdf_url || null,
        documentation: [],
      };

      localStorage.setItem("legacyDocResult", JSON.stringify(fallbackResult));
    }

    if (item.repo_url) {
      localStorage.setItem("repoUrl", item.repo_url);
    }

    navigate("/resultado");
  }

  function handleDownload(item: HistoryItem) {
    if (!item.pdf_url) {
      alert("PDF não disponível para este item.");
      return;
    }

    const pdfUrl = item.pdf_url.startsWith("http")
      ? item.pdf_url
      : `http://127.0.0.1:8000${item.pdf_url}`;

    window.open(pdfUrl, "_blank");
  }

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Histórico</span>

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
              <div className="log-item empty-history">
                <div className="log-left">
                  <strong>Nenhuma análise ainda</strong>
                  <span className="status pending">Sem registros</span>
                </div>
              </div>
            ) : (
              history.map((item) => (
                <article className="log-item" key={item.id}>
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

                    <small>{item.createdAt}</small>

                    {typeof item.total_functions === "number" && (
                      <small>Funções: {item.total_functions}</small>
                    )}

                    <p>{item.summary}</p>
                  </div>

                  <div className="log-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleViewResult(item)}
                    >
                      Ver resultado
                    </button>

                    <button className="btn" onClick={() => handleDownload(item)}>
                      Download
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}