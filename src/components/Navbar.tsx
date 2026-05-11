import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="topbar">
      <div className="logo">Legacy Doc</div>

      <nav>
        <Link to="/">Início</Link>
        <Link to="/log">Histórico</Link>
        <Link to="/login">Entrar</Link>

        <button
          type="button"
          className="theme-btn"
          onClick={() => setDark((prev) => !prev)}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </nav>
    </header>
  );
}