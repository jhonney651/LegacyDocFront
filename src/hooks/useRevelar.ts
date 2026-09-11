import { useEffect } from "react";

/** Tempo até desistir da animação e mostrar tudo. */
const PRAZO_DE_SEGURANCA_MS = 1200;

/**
 * Revela elementos marcados com `data-revelar` quando entram na tela.
 *
 * A primeira versão usava `animation-timeline: view()`, que é a forma moderna e
 * não custa JavaScript nenhum. Não sobreviveu ao layout real: os ancestrais
 * usam `overflow: clip` para cortar cantos arredondados, e sob eles a linha do
 * tempo devolvia tempo negativo, deixando o conteúdo parado no estado inicial.
 *
 * Daí vem a regra que orienta o resto deste arquivo: animação aqui é
 * decoração, e decoração não pode ter como modo de falha um documento
 * ilegível. Por isso existem três garantias, e não uma:
 *
 * 1. O estado padrão no CSS é visível. A classe que apaga só é aplicada depois
 *    de o observador existir, ou seja, nunca sem quem a desfaça.
 * 2. Quem já está na tela é revelado no mesmo quadro, sem esperar evento.
 * 3. Se o observador não der sinal de vida dentro do prazo, tudo é revelado
 *    de uma vez. A condição é o observador nunca ter chamado de volta, e não
 *    o tempo em si: um prazo cego revelaria também o que está longe e
 *    anularia o efeito para quem rola devagar.
 */
export function useRevelar(dependencias: unknown[] = []) {
  useEffect(() => {
    const alvos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-revelar]")
    );

    if (alvos.length === 0) return;

    const revelar = (elemento: Element) => {
      elemento.classList.add("revelado");
      elemento.classList.remove("por-revelar");
    };

    const revelarTudo = () => alvos.forEach(revelar);

    const querMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (querMenosMovimento || typeof IntersectionObserver === "undefined") {
      revelarTudo();
      return;
    }

    let observadorRespondeu = false;

    const observador = new IntersectionObserver(
      (entradas) => {
        // Basta uma chamada de volta, com ou sem intersecao: prova que o
        // mecanismo esta vivo e que a rede de seguranca nao precisa agir.
        observadorRespondeu = true;

        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;

          revelar(entrada.target);

          // Revela uma vez só. Reanimar a cada rolagem cansa quem está
          // relendo o mesmo documento.
          observador.unobserve(entrada.target);
        }
      },
      // Dispara um pouco antes de entrar de fato, para a animação terminar
      // quando o olho chega no elemento em vez de depois.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.03 }
    );

    for (const alvo of alvos) {
      const caixa = alvo.getBoundingClientRect();
      const jaVisivel = caixa.top < window.innerHeight && caixa.bottom > 0;

      // Quem abre a tela já vendo o elemento não deve ver ele nascer.
      if (jaVisivel) {
        revelar(alvo);
        continue;
      }

      alvo.classList.add("por-revelar");
      observador.observe(alvo);
    }

    const prazo = window.setTimeout(() => {
      if (!observadorRespondeu) revelarTudo();
    }, PRAZO_DE_SEGURANCA_MS);

    return () => {
      window.clearTimeout(prazo);
      observador.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
}
