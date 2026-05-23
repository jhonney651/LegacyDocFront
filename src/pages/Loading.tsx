import Navbar from "../components/Navbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    async function gerarAnalise() {
      const repoUrl = localStorage.getItem("repoUrl");

      if (!repoUrl) {
        alert("Nenhum repositório informado.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            github_url: repoUrl,
            file_path: "calculadora.cpp",
          }),
        });

        const responseText = await response.text();

        console.log("Status da API:", response.status);
        console.log("Resposta da API:", responseText);

        if (!response.ok) {
          alert(`Erro da API: ${response.status}`);
          navigate("/");
          return;
        }

        const data = JSON.parse(responseText);

        localStorage.setItem("legacyDocResult", JSON.stringify(data));

        const functions = Array.isArray(data?.documentation)
          ? data.documentation
          : data?.documentation?.functions ?? [];

        const firstFunction = functions[0];

        const rawHistory = localStorage.getItem("legacyDocHistory");
        const history = rawHistory ? JSON.parse(rawHistory) : [];

        const newItem = {
          id: Date.now(),
          createdAt: new Date().toLocaleString("pt-BR"),
          repo_url: repoUrl,
          file: data?.file || "Repositório analisado",
          summary:
            firstFunction?.summary ||
            data?.summary ||
            "Documentação gerada com sucesso.",
          status: data?.status || "success",
          pdf_url: data?.pdf_url || null,
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
        console.error("Erro ao gerar documentação:", error);
        alert("Erro ao gerar documentação.");
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

          <h1>Gerando documentação...</h1>

          <p className="hero-subtitle">
            Nossa IA está analisando o repositório e organizando as informações.
          </p>

          <div className="loader"></div>
        </section>
      </main>
    </>
  );
}