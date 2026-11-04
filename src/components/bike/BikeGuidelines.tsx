"use client";

import { useState } from "react";

const GUIDELINES = [
  {
    id: "intensity",
    title: "1. Como ajustar a intensidade da bicicleta",
    summary: "Cadência constante, carga leve a moderada.",
    content:
      "Mantenha uma cadência confortável e ritmada (entre 70 e 85 RPM). Ajuste a resistência da bicicleta para que o esforço seja perceptível, mas não trave os joelhos ou queime excessivamente os quadríceps. O objetivo nesta fase de 6 semanas é construir base aeróbica, e não esgotar as pernas.",
  },
  {
    id: "talk-test",
    title: "2. Como utilizar o teste da fala",
    summary: "Verificação prática da zona aeróbica sem precisar de sensores.",
    content:
      "Durante a parte principal da pedalada, fale em voz alta uma frase completa (por exemplo: 'Hoje o treino está fluindo no ritmo certo'). Se você conseguir falar frases inteiras com facilidade, está no ritmo ideal. Se começar a falar apenas palavras picadas ou faltar ar no meio da frase, reduza um pouco o ritmo.",
  },
  {
    id: "pse-scale",
    title: "3. Como interpretar a escala de esforço (PSE 0–10)",
    summary: "Zona alvo do programa: PSE 3–4 (moderado).",
    content:
      "A escala vai de 0 (repouso absoluto no sofá) a 10 (esforço máximo insustentável). Neste programa, seu alvo é 3 a 4 (moderado: você sente o coração trabalhando, respiração acelerada mas controlada e um suor leve). Evite passar de PSE 6 nesta fase de base para não prejudicar a recuperação dos treinos de musculação e Jiu-Jitsu.",
  },
  {
    id: "bpm-tracking",
    title: "4. Como registrar BPM médio e máximo",
    summary: "Opcional: preencha se tiver smartwatch ou cinta cardíaca.",
    content:
      "A faixa de 105–125 BPM é uma estimativa de referência provisória. Se você usa relógio ou cinta, consulte o resumo da atividade após o treino e anote a FC média e a FC máxima. Se não tiver monitor, deixe esses campos em branco — o teste da fala e a PSE são suficientes para orientar o treino com segurança.",
  },
  {
    id: "muscle-fatigue",
    title: "5. Como reconhecer fadiga muscular acumulada",
    summary: "Cuidado com a sobreposição com os treinos A e B de musculação.",
    content:
      "Como os treinos A e B da Prime exigem muito das pernas (agachamentos, avanços, etc.), avalie a fadiga de 0 a 10 no registro. Se a fadiga nas pernas estiver em 7 ou mais, ou se você sentir as pernas pesadas e sem explosão no tatame, reduza a resistência da bike ou faça a sessão mais curta.",
  },
  {
    id: "repeat-week",
    title: "6. Quando repetir uma semana",
    summary: "Progressão consciente respeitando a recuperação biológica.",
    content:
      "Não progrida apenas porque os dias passaram. Se durante a semana você teve sintomas incomuns, ficou doente, dormiu mal, faltou a duas ou mais sessões por cansaço ou sentiu esforço acima do planejado, use o botão 'Repetir semana'. Repetir uma semana é sinal de maturidade esportiva para garantir adaptação real.",
  },
  {
    id: "body-composition",
    title: "7. Como acompanhar peso e composição corporal",
    summary: "Padronize o horário da pesagem para evitar variações falsas.",
    content:
      "Pese-se preferencialmente pela manhã, em jejum e após ir ao banheiro. Balanças de bioimpedância sofrem grande influência do estado de hidratação, ingestão de sódio e refeições recentes — por isso, encare os percentuais de gordura como estimativas de tendência ao longo das semanas, e não valores absolutos milimétricos.",
  },
];

export function BikeGuidelines() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-label="Instruções e orientações práticas"
      className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <h3 className="text-lg font-black text-white">Orientações Práticas do Programa</h3>
          <p className="text-xs text-zinc-400">
            Dicas curtas para ajustar intensidade, teste da fala e recuperação muscular.
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {GUIDELINES.map((item) => {
          const isOpen = openItem === item.id;
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 transition"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs sm:text-sm font-bold text-zinc-200 hover:text-white"
              >
                <div className="pr-2">
                  <p>{item.title}</p>
                  <p className="text-[11px] font-normal text-zinc-400 mt-0.5">{item.summary}</p>
                </div>
                <span className="shrink-0 text-zinc-500 font-bold">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-800/80 bg-zinc-900/30 p-3.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
