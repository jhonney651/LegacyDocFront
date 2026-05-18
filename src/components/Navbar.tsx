import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

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
      <Link to="/" className="logo-link">
        <img src={logo} alt="Legacy Doc" className="logo-img" />
      </Link>

      <nav>
        <NavLink to="/">Início</NavLink>
        <NavLink to="/log">Histórico</NavLink>
        <NavLink to="/login">Entrar</NavLink>

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