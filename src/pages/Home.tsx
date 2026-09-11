import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getAuthToken, getCurrentUser, type CurrentUser } from "../services/api";
import { useRevelar } from "../hooks/useRevelar";

type DepthInfo = {
  title: string;
  note: string;
  cost: string;
};

/**
 * O que cada degrau entrega, em vez de so o nome dele.
 *
 * Um <select> escondia a diferenca justamente no momento em que a pessoa
 * precisa compara-la, e a diferenca e de custo: o nivel completo sai por
 * quase dez vezes o basico. Quem escolhe no escuro descobre na fatura.
 */
const DEPTH_INFO: Record<string, DepthInfo> = {
  basic: {
    title: "Básico",
    note: "Documenta cada função, classe e método do repositório.",
    cost: "~US$ 0,002 por arquivo",
  },
  standard: {
    title: "Padrão",
    note: "Soma os pontos de melhoria: risco, complexidade e code smell.",
    cost: "~US$ 0,009 por arquivo",
  },
  pro: {
    title: "Completo",
    note: "Soma a auditoria que confere a documentação contra o código.",
    cost: "~US$ 0,023 por arquivo",
  },
};

export default function Home() {

  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [depth, setDepth] = useState("");
  const [account, setAccount] = useState<CurrentUser | null>(null);
  const campoRepo = useRef<HTMLInputElement>(null);

  // Reobserva quando a conta carrega: os cartoes de profundidade so
  // existem depois que a API responde qual e o plano.
  useRevelar([account?.id]);

  // Atalho "/" para cair no campo, como GitHub, Slack e todo editor.
  // Quem usa a ferramenta passa o dia no teclado; obrigar a pegar o
  // mouse para comecar e a fricção mais boba que existe.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "/" || evento.defaultPrevented) return;

      const alvo = evento.target as HTMLElement | null;
      const digitando =
        alvo instanceof HTMLInputElement ||
        alvo instanceof HTMLTextAreaElement ||
        alvo?.isContentEditable;

      if (digitando) return;

      evento.preventDefault();
      campoRepo.current?.focus();
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

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
      navigate("/login", { viewTransition: true });
      return;
    }

    localStorage.setItem("repoUrl", repoUrl.trim());
    localStorage.setItem("repoBranch", branch.trim());
    localStorage.setItem("repoDepth", depth);
    navigate("/loading", { viewTransition: true });
  }

  const depths = account?.plan.available_depths ?? [];
  const remaining = account
    ? account.plan.monthly_cost_limit_usd - account.spent_this_month_usd
    : null;

  return (
    <>
      <Navbar />

      <main id="conteudo" className="home-page">
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
              ref={campoRepo}
              type="url"
              aria-label="URL do repositório"
              placeholder="https://github.com/user/projeto"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze();
              }}
            />

            <span className="search-hint" aria-hidden="true">
              <kbd>/</kbd> para focar
            </span>

            <button type="button" onClick={handleAnalyze}>
              Analisar
            </button>
          </div>

          {account && (
            <div className="home-branch">
              <label htmlFor="branch">Branch</label>

              <input
                id="branch"
                type="text"
                placeholder="Deixe vazio para usar a padrão"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
              />
            </div>
          )}

          {account && depths.length > 0 && (
            <fieldset className="depth-options" data-revelar>
              <legend className="sr-only">Profundidade da análise</legend>

              {depths.map((item) => {
                const info = DEPTH_INFO[item];
                const selecionado = depth === item;
                const ehPro = item === "pro";

                const cartao = (
                  <button
                    type="button"
                    className="depth-card"
                    aria-pressed={selecionado}
                    onClick={() => setDepth(item)}
                  >
                    <span className="depth-card-title">
                      {info?.title ?? item}
                      {ehPro && <span className="pro-badge">Pro</span>}
                    </span>
                    <span className="depth-card-note">{info?.note}</span>
                    <span className="depth-card-cost">{info?.cost}</span>
                  </button>
                );

                // A moldura girando so envolve o degrau mais profundo, e so
                // quando ele esta escolhido: animar o tempo todo compete com
                // a leitura das outras opcoes.
                return ehPro && selecionado ? (
                  <div className="pro-frame" key={item}>
                    {cartao}
                  </div>
                ) : (
                  <div key={item}>{cartao}</div>
                );
              })}
            </fieldset>
          )}

          {account && (
            <p className="home-quota">
              Plano <strong>{account.plan.display_name}</strong> · até{" "}
              {account.plan.max_files_per_job} arquivos por análise · restam{" "}
              <strong>US$ {remaining?.toFixed(2)}</strong> neste mês
            </p>
          )}
        </section>
      </main>
    </>
  );
}
