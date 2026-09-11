import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuthToken, getCurrentUser, type CurrentUser } from "../services/api";

const DEPTH_LABELS: Record<string, string> = {
  basic: "Basico — documenta o codigo",
  standard: "Padrao — soma os pontos de melhoria",
  pro: "Completo — soma a auditoria de fidelidade",
};

export default function Home() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [depth, setDepth] = useState("");
  const [account, setAccount] = useState<CurrentUser | null>(null);

  // A escada de profundidades vem da API, nao fica fixa aqui. O backend e a
  // fonte da verdade sobre o que cada plano libera, e uma copia no front
  // diverge no dia em que um plano mudar.
  useEffect(() => {
    if (!getAuthToken()) return;

    getCurrentUser()
      .then((user) => {
        setAccount(user);
        setDepth(user.plan.max_depth);
      })
      .catch(() => setAccount(null));
  }, []);

  function handleAnalyze() {
    if (!repoUrl.trim()) {
      alert("Cole um link de repositório.");
      return;
    }

    if (!getAuthToken()) {
      navigate("/login");
      return;
    }

    localStorage.setItem("repoUrl", repoUrl.trim());
    localStorage.setItem("repoBranch", branch.trim());
    localStorage.setItem("repoDepth", depth);
    navigate("/loading");
  }

  const depths = account?.plan.available_depths ?? [];
  const remaining = account
    ? account.plan.monthly_cost_limit_usd - account.spent_this_month_usd
    : null;

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

          {account && (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <input
                type="text"
                aria-label="Branch"
                placeholder="Branch (opcional)"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{ padding: "0.6rem 0.9rem", borderRadius: 8, minWidth: 180 }}
              />

              <select
                aria-label="Profundidade da analise"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                style={{ padding: "0.6rem 0.9rem", borderRadius: 8, minWidth: 320 }}
              >
                {depths.map((item) => (
                  <option key={item} value={item}>
                    {DEPTH_LABELS[item] ?? item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {account && (
            <p style={{ marginTop: "0.75rem", opacity: 0.75, fontSize: "0.9rem" }}>
              Plano {account.plan.display_name} · até {account.plan.max_files_per_job} arquivos
              por análise · restam US$ {remaining?.toFixed(2)} neste mês
            </p>
          )}
        </section>
      </main>
    </>
  );
}
