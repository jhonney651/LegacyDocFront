import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { clearAuthToken, getAuthToken, getCurrentUser } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));

  /**
   * Se esta conta abre o painel.
   *
   * Esconder o link não é controle de acesso: o painel recusa por conta própria
   * quem não for administrador, respondendo 404. Isto existe para não oferecer
   * uma porta que a pessoa vai bater e não passar.
   */
  const [isAdmin, setIsAdmin] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  // Sem `setState` sincrono aqui: sair da conta nao zera o estado por efeito,
  // e sim deixa de ser considerado na hora de desenhar. Zerar aqui provocaria
  // um render a mais so para apagar um booleano.
  useEffect(() => {
    if (!isAuthenticated) return;

    let ativo = true;

    getCurrentUser()
      .then((conta) => ativo && setIsAdmin(conta.is_admin))
      .catch(() => ativo && setIsAdmin(false));

    return () => {
      ativo = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function syncAuthState() {
      setIsAuthenticated(Boolean(getAuthToken()));
    }

    window.addEventListener("legacydoc-auth-updated", syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("legacydoc-auth-updated", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function handleLogout() {
    clearAuthToken();
    navigate("/login");
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

    <header className="topbar">
      <Link to="/" viewTransition className="logo-link">
        <img src={logo} alt="Legacy Doc" className="logo-img" />
      </Link>

      <nav>
        <NavLink viewTransition to="/">Inicio</NavLink>
        {isAuthenticated && isAdmin && (
          <NavLink viewTransition to="/admin" className="nav-link">
            Painel
          </NavLink>
        )}

        <NavLink viewTransition to="/log">Historico</NavLink>
        {isAuthenticated ? (
          <button type="button" className="nav-link-button" onClick={handleLogout}>
            Sair
          </button>
        ) : (
          <NavLink viewTransition to="/login">Entrar</NavLink>
        )}

        <button
          type="button"
          className="theme-btn"
          onClick={() => setDark((prev) => !prev)}
        >
          {dark ? "Claro" : "Escuro"}
        </button>
      </nav>
    </header>
    </>
  );
}
