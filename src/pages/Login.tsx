import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <h1>Entrar</h1>
          <p className="hero-subtitle">Acesse sua conta para continuar</p>

          <div className="form-box">
            <input type="email" placeholder="Seu email" />
            <input type="password" placeholder="Sua senha" />

            <button onClick={() => navigate("/")}>Entrar</button>
          </div>

          <Link to="/criar-conta" className="link">
            Criar conta
          </Link>

          <Link to="/troca-senha" className="link">
            Esqueci minha senha
          </Link>
        </section>
      </main>
    </>
  );
}