import Navbar from "../components/Navbar";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, setAuthToken } from "../services/api";

const SENHA_MINIMA = 10;

export default function NovaSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro("");

    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas nao conferem.");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await confirmPasswordReset(token, senha);

      // A API devolve sessao junto com a troca, então o usuário já entra
      // autenticado em vez de digitar a senha que acabou de criar.
      setAuthToken(resposta.access_token);
      navigate("/");
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Nao foi possivel redefinir a senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  if (!token) {
    return (
      <>
        <Navbar />

        <main className="main-screen">
          <section className="hero">
            <span className="badge">Link inválido</span>

            <h1>Link incompleto</h1>

            <p className="hero-subtitle">
              Este endereço não traz um token de redefinição. Abra o link exatamente
              como ele chegou no e-mail.
            </p>

            <Link to="/troca-senha" className="link">
              Pedir um novo link
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="main-screen">
        <section className="hero">
          <span className="badge">Recuperação de acesso</span>

          <h1>Criar nova senha</h1>

          <p className="hero-subtitle">
            Escolha uma senha com pelo menos {SENHA_MINIMA} caracteres, misturando
            letras e números.
          </p>

          <form className="form-box" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nova senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="new-password"
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              autoComplete="new-password"
            />

            {erro && <p className="form-error">{erro}</p>}

            <button disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>

          <Link to="/troca-senha" className="link">
            Pedir um novo link
          </Link>
        </section>
      </main>
    </>
  );
}
