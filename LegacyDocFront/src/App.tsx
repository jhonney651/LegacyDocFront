import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import CriarConta from "./pages/CriarConta";
import TrocaSenha from "./pages/TrocaSenha";
import Loading from "./pages/Loading";
import Resultado from "./pages/Resultado";
import Log from "./pages/Log";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/criar-conta" element={<CriarConta />} />
        <Route path="/troca-senha" element={<TrocaSenha />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/log" element={<Log />} />
        <Route path="*" element={<h1 style={{ padding: "40px" }}>Página não encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;