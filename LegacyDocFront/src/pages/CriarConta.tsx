import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";

export default function CriarConta() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Cadastro</span>

          <h1>Criar sua conta</h1>

          <p className="hero-subtitle">
            Comece a usar a plataforma para gerar documentações automáticas com
            inteligência artificial.
          </p>

          <div className="form-box">
            <input type="text" placeholder="Nome completo" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Senha" />
            <input type="password" placeholder="Confirmar senha" />

            <button onClick={() => navigate("/")}>Criar conta</button>
          </div>

          <Link to="/login" className="link">
            Já tem uma conta? Entrar
          </Link>
        </section>
      </main>
    </>
  );
}