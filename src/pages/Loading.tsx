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
            file_path: null,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro do backend:", errorText);

          alert(`Erro da API: ${response.status}`);
          navigate("/");
          return;
        }

        const data = await response.json();

        localStorage.setItem("legacyDocResult", JSON.stringify(data));

        const doc = data?.documentation ?? data;

        const rawHistory = localStorage.getItem("legacyDocHistory");
        const history = rawHistory ? JSON.parse(rawHistory) : [];

        const newItem = {
          id: Date.now(),
          createdAt: new Date().toLocaleString("pt-BR"),
          repo_url: repoUrl,
          file: doc?.file || data?.file || "Repositório analisado",
          summary: doc?.summary || data?.summary || "Sem resumo",
          status: data?.status || "success",
          pdf_url: data?.pdf_url || null,
          total_functions: doc?.functions?.length || 0,
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