import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    async function gerarDocumentacao() {
      try {
        const repoUrl = localStorage.getItem("repoUrl");
        const filePath = localStorage.getItem("filePath");

        if (!repoUrl || !filePath) {
          alert("Dados inválidos.");
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:8000/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            github_url: repoUrl,
            file_path: filePath,
          }),
        });

        const data = await response.json();

        if (response.status === 200) {
          localStorage.setItem("analysisResult", JSON.stringify(data));
          navigate("/resultado");
          return;
        }

        console.error("Erro na API:", response.status, data);
        setError(
          data?.detail ||
            data?.message ||
            `Erro ao gerar documentação. Status: ${response.status}`
        );
      } catch (error) {
        console.error("Erro ao conectar com a API:", error);
        setError("Não foi possível conectar com a API.");
      }
    }

    gerarDocumentacao();
  }, [navigate]);

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Processando</span>

          <h1>Gerando documentação...</h1>

          <p className="hero-subtitle">
            Nossa IA está analisando o repositório e organizando as informações.
          </p>

          {!error && <div className="loader"></div>}

          {error && (
            <div className="card section-card">
              <h3>Erro ao gerar documentação</h3>
              <p className="section-text">{error}</p>

              <div className="actions">
                <button className="btn" onClick={() => navigate("/")}>
                  Voltar para início
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}