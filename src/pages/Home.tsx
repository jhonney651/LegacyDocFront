import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");

  function handleAnalyze() {
    if (!repoUrl.trim()) {
      alert("Cole um link de repositório.");
      return;
    }

    localStorage.setItem("repoUrl", repoUrl.trim());
    navigate("/loading");
  }

  return (
    <>
      <Navbar />

      <main className="home-page">
        <div className="home-overlay"></div>

        <section className="home-hero">
          <span className="badge">IA para análise de código</span>

          <h1>Analise e entenda repositórios de código automaticamente</h1>

          <p>
            Cole o link de um repositório e obtenha insights sobre estrutura,
            tecnologias utilizadas e possíveis melhorias no projeto.
          </p>

          <div className="home-search">
            <input
              type="url"
              placeholder="https://github.com/user/projeto"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze();
              }}
            />

            <button type="button" onClick={handleAnalyze}>
              Analisar
            </button>
          </div>
        </section>

      </main>
    </>
  );
}