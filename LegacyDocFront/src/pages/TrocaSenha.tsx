import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function TrocaSenha() {
  const [mensagemVisivel, setMensagemVisivel] = useState(false);

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Recuperação de acesso</span>

          <h1>Esqueceu sua senha?</h1>

          <p className="hero-subtitle">
            Informe seu e-mail e enviaremos instruções para redefinir sua senha.
          </p>

          <div className="form-box">
            <input type="email" placeholder="Seu email" />

            <button onClick={() => setMensagemVisivel(true)}>
              Enviar instruções
            </button>
          </div>

          {mensagemVisivel && (
            <p className="success-msg">✔ Instruções enviadas para seu e-mail!</p>
          )}

          <Link to="/login" className="link">
            Voltar para login
          </Link>
        </section>
      </main>
    </>
  );
}