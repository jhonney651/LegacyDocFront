import Navbar from "../components/Navbar";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateDocumentation } from "../services/api";

function readHistory() {
  const rawHistory = localStorage.getItem("legacyDocHistory");

  if (!rawHistory) return [];

  try {
    const parsed = JSON.parse(rawHistory);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Loading() {
  const navigate = useNavigate();
  const hasStarted = useRef(false);

  useEffect(() => {
    async function gerarAnalise() {
      if (hasStarted.current) return;
      hasStarted.current = true;

      const repoUrl = localStorage.getItem("repoUrl");

      if (!repoUrl) {
        alert("Nenhum repositorio informado.");
        navigate("/");
        return;
      }

      try {
        const data = await generateDocumentation({
          github_url: repoUrl,
          file_path: "TESTE",
        });

        localStorage.setItem("legacyDocResult", JSON.stringify(data));

        const functions = Array.isArray(data?.documentation)
          ? data.documentation
          : [];

        const firstFunction = functions[0];

        const history = readHistory();

        const newItem = {
          id: Date.now(),
          createdAt: new Date().toLocaleString("pt-BR"),
          repo_url: repoUrl,
          file: data?.file || "Repositorio analisado",
          summary:
            firstFunction?.summary ||
            data?.message ||
            "Documentacao gerada com sucesso.",
          status: data?.status || "success",
          pdf_url: data?.pdf_url || null,
          markdown_url: data?.markdown_url || null,
          total_functions: functions.length,
          resultData: data,
        };

        localStorage.setItem(
          "legacyDocHistory",
          JSON.stringify([newItem, ...history])
        );

        window.dispatchEvent(new Event("legacydoc-history-updated"));

        navigate("/resultado");
      } catch (error) {
        console.error("Erro ao gerar documentacao:", error);
        alert(error instanceof Error ? error.message : "Erro ao gerar documentacao.");
        navigate("/");
      }
    }

    gerarAnalise();
  }, [navigate]);

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Processando</span>

          <h1>Gerando documentacao...</h1>

          <p className="hero-subtitle">
            Nossa IA esta analisando o repositorio e organizando as informacoes.
          </p>

          <div className="loader"></div>
        </section>
      </main>
    </>
  );
}
