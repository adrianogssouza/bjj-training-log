import type { Workout } from "@/types";

export const seedWorkouts: Workout[] = [
  {
    id: "treino-a-abril-26",
    title: "Treino A Abril/26",
    month: "Abril",
    year: 2026,
    type: "monthly",
    description: "Treino do mês — Abril/26 — Treino A",
    blocks: [
      {
        id: "a-cocoras-samurai-carregada-oh",
        title: "Cócoras/Samurai + Carregada OH",
        type: "bi_set",
        sets: "2-3",
        order: 1,
        items: [
          {
            id: "a-cocoras-samurai",
            name: "Cócoras/Samurai",
            reps: "8",
            targetPse: "6",
            videoUrl: "https://www.youtube.com/shorts/feFImpiO0XU",
          },
          {
            id: "a-carregada-oh",
            name: "Carregada OH",
            time: "20s cada lado",
            targetPse: "7",
            videoUrl: "https://www.youtube.com/shorts/twtfttmpsyc",
          },
        ],
      },
      {
        id: "a-passada-para-tras-zercher-x",
        title: "Passada para Trás Zercher X",
        type: "single",
        sets: "2 válidas",
        order: 2,
        items: [
          {
            id: "a-passada-para-tras-zercher-x-item",
            name: "Passada para Trás Zercher X",
            reps: "6 cada lado",
            targetPse: "9",
            // Placeholder aproximado: variação de avanço/lunge com carga.
            videoUrl: "https://www.youtube.com/shorts/5tv44zvN7JQ",
          },
        ],
      },
      {
        id: "a-supino-inclinado-hbl",
        title: "Supino Inclinado HBL",
        type: "single",
        sets: "2 válidas",
        order: 3,
        items: [
          {
            id: "a-supino-inclinado-hbl-item",
            name: "Supino Inclinado HBL",
            reps: "6",
            targetPse: "9",
            videoUrl: "https://www.youtube.com/shorts/Y2jb9yq7VQM",
          },
        ],
      },
      {
        id: "a-paralela-cadeirinha",
        title: "Paralela + Cadeirinha",
        type: "bi_set",
        sets: "3",
        order: 4,
        items: [
          {
            id: "a-paralela",
            name: "Paralela",
            reps: "8",
            targetPse: "8",
            // Placeholder aproximado: execução de dips/paralela.
            videoUrl: "https://www.youtube.com/shorts/CIPJXlTlJzQ",
          },
          {
            id: "a-cadeirinha",
            name: "Cadeirinha",
            time: "20s",
            targetPse: "8",
            // Placeholder aproximado: wall sit/cadeira isométrica.
            videoUrl: "https://www.youtube.com/shorts/B4hLPetP5cM",
          },
        ],
      },
      {
        id: "a-abducao-ombros-triceps-frances",
        title: "Abdução de Ombros Unilateral Cabo + Tríceps Francês Cabo",
        type: "bi_set",
        sets: "2-3",
        order: 5,
        items: [
          {
            id: "a-abducao-ombros-unilateral-cabo",
            name: "Abdução de Ombros Unilateral Cabo",
            reps: "15 cada lado",
            targetPse: "8",
            // Placeholder aproximado: elevação lateral/abdução de ombro no cabo.
            videoUrl: "https://www.youtube.com/shorts/tYsES_zSj5A",
          },
          {
            id: "a-triceps-frances-cabo",
            name: "Tríceps Francês Cabo",
            reps: "15",
            targetPse: "8",
            // Placeholder aproximado: extensão de tríceps no cabo.
            videoUrl: "https://www.youtube.com/shorts/ajIMk3TJ_OA",
          },
        ],
      },
      {
        id: "a-cardio",
        title: "Cardio",
        type: "cardio",
        sets: "4x",
        order: 6,
        items: [
          {
            id: "a-cardio-item",
            name: "Cardio",
            time: "2min / 1min30s",
            targetPse: "9",
            videoUrl: "https://www.youtube.com/shorts/wxNMn0MzuU0",
          },
        ],
      },
    ],
  },
  {
    id: "treino-b-abril-26",
    title: "Treino B Abril/26",
    month: "Abril",
    year: 2026,
    type: "monthly",
    description: "Treino do mês — Abril/26 — Treino B",
    blocks: [
      {
        id: "b-pancake-flexao-lateral-sentado",
        title: "Pancake + Flexão Lateral Sentado",
        type: "bi_set",
        sets: "2-3",
        order: 1,
        items: [
          {
            id: "b-pancake",
            name: "Pancake",
            reps: "8",
            targetPse: "6",
            videoUrl: "https://www.youtube.com/shorts/fQVZ6nzbwV0",
          },
          {
            id: "b-flexao-lateral-sentado",
            name: "Flexão Lateral Sentado",
            reps: "8 cada lado",
            targetPse: "7",
            // Placeholder aproximado: flexão lateral de tronco.
            videoUrl: "https://www.youtube.com/shorts/AcKEB6LKWCY",
          },
        ],
      },
      {
        id: "b-hang-clean-hbl",
        title: "Hang Clean HBL",
        type: "single",
        sets: "2 válidas",
        order: 2,
        items: [
          {
            id: "b-hang-clean-hbl-item",
            name: "Hang Clean HBL",
            reps: "6",
            targetPse: "9",
            videoUrl: "https://www.youtube.com/shorts/lARImTpOQ-Q",
          },
        ],
      },
      {
        id: "b-deadlift-unilateral",
        title: "Deadlift Unilateral",
        type: "single",
        sets: "2 válidas",
        order: 3,
        items: [
          {
            id: "b-deadlift-unilateral-item",
            name: "Deadlift Unilateral",
            reps: "6 cada lado",
            targetPse: "9",
            videoUrl: "https://www.youtube.com/shorts/IY6ZmuOH0SU",
          },
        ],
      },
      {
        id: "b-elevacao-quadril-barra-fixa",
        title: "Elevação de Quadril HBL + Barra Fixa Aberta",
        type: "bi_set",
        sets: "3",
        order: 4,
        items: [
          {
            id: "b-elevacao-quadril-hbl",
            name: "Elevação de Quadril HBL",
            reps: "8",
            targetPse: "8",
            // Placeholder aproximado: hip thrust/elevação de quadril com carga.
            videoUrl: "https://www.youtube.com/shorts/zzMTVP6C14w",
          },
          {
            id: "b-barra-fixa-aberta",
            name: "Barra Fixa Aberta",
            reps: "8",
            targetPse: "8",
            // Placeholder aproximado: pull-up/barra fixa com pegada aberta.
            videoUrl: "https://www.youtube.com/shorts/ZgsJza4VCww",
          },
        ],
      },
      {
        id: "b-biceps-banco-flexao-pescoco",
        title: "Bíceps Banco Inclinado + Flexão de Pescoço",
        type: "bi_set",
        sets: "2-3",
        order: 5,
        items: [
          {
            id: "b-biceps-banco-inclinado",
            name: "Bíceps Banco Inclinado",
            reps: "8",
            targetPse: "8",
            // Placeholder aproximado: rosca bíceps no banco inclinado.
            videoUrl: "https://www.youtube.com/shorts/jHNY9ZORsHs",
          },
          {
            id: "b-flexao-pescoco",
            name: "Flexão de Pescoço",
            reps: "15",
            targetPse: "8",
            // Placeholder aproximado: mobilidade/fortalecimento cervical.
            videoUrl: "https://www.youtube.com/shorts/DE7Ven3ojL4",
          },
        ],
      },
      {
        id: "b-cardio",
        title: "Cardio",
        type: "cardio",
        sets: "1x",
        order: 6,
        items: [
          {
            id: "b-cardio-item",
            name: "Cardio",
            time: "6min",
            targetPse: "8",
            videoUrl: "https://www.youtube.com/shorts/wuSgLbxezCk",
          },
        ],
      },
    ],
  },
  {
    id: "mobilidade-com-peso",
    title: "Mobilidade com Peso Guiada",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência guiada de mobilidade com carga leve.",
    blocks: [
      {
        id: "mobilidade-com-peso-sequencia",
        title: "Sequência completa",
        type: "mobility",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "mobilidade-com-peso-video-completo",
            name: "Mobilidade com Peso Guiada",
            time: "Vídeo completo",
            targetPse: "5",
            videoUrl: "https://www.youtube.com/watch?v=c2-Fbra9Z1M&t=239s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "mobilidade-sem-peso",
    title: "Mobilidade sem Peso Guiada",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência guiada de mobilidade sem carga.",
    blocks: [
      {
        id: "mobilidade-sem-peso-sequencia",
        title: "Sequência completa",
        type: "mobility",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "mobilidade-sem-peso-video-completo",
            name: "Mobilidade sem Peso Guiada",
            time: "Vídeo completo",
            targetPse: "4",
            videoUrl: "https://www.youtube.com/watch?v=eKlO-7GtBqQ&t=515s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "mobilidade-3",
    title: "Mobilidade Geral Guiada",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência geral de mobilidade para encaixar na semana.",
    blocks: [
      {
        id: "mobilidade-3-sequencia",
        title: "Sequência completa",
        type: "mobility",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "mobilidade-3-video-completo",
            name: "Mobilidade Geral Guiada",
            time: "Vídeo completo",
            targetPse: "5",
            videoUrl: "https://www.youtube.com/watch?v=e3V83yp3u98&t=182s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "core-1",
    title: "Core 1 - Controle",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência guiada de core com foco em controle e estabilidade.",
    blocks: [
      {
        id: "core-1-sequencia",
        title: "Sequência completa",
        type: "circuit",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "core-1-video-completo",
            name: "Core 1 - Controle",
            time: "Vídeo completo",
            targetPse: "7",
            videoUrl: "https://www.youtube.com/watch?v=MtsqH-liroA&t=534s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "core-2",
    title: "Core 2 - Resistência",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência guiada de core com foco em resistência de tronco.",
    blocks: [
      {
        id: "core-2-sequencia",
        title: "Sequência completa",
        type: "circuit",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "core-2-video-completo",
            name: "Core 2 - Resistência",
            time: "Vídeo completo",
            targetPse: "7",
            videoUrl: "https://www.youtube.com/watch?v=OXrovylyZAk",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-1",
    title: "Cardio 1 - Leve",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado leve para encaixar sem pesar a semana.",
    blocks: [
      {
        id: "cardio-1-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-1-video-completo",
            name: "Cardio 1 - Leve",
            time: "Vídeo completo",
            targetPse: "7",
            videoUrl: "https://www.youtube.com/watch?v=LFPsmpxOEXo&t=33s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-2",
    title: "Cardio 2 - Base",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado de base para condicionamento geral.",
    blocks: [
      {
        id: "cardio-2-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-2-video-completo",
            name: "Cardio 2 - Base",
            time: "Vídeo completo",
            targetPse: "7",
            videoUrl: "https://www.youtube.com/watch?v=H5-XC6_ROZk&t=31s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-3",
    title: "Cardio 3 - Moderado",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado em ritmo moderado.",
    blocks: [
      {
        id: "cardio-3-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-3-video-completo",
            name: "Cardio 3 - Moderado",
            time: "Vídeo completo",
            targetPse: "8",
            videoUrl: "https://www.youtube.com/watch?v=OQDfR8YPxOU&t=4s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-4",
    title: "Cardio 4 - Condicionamento",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado para condicionamento.",
    blocks: [
      {
        id: "cardio-4-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-4-video-completo",
            name: "Cardio 4 - Condicionamento",
            time: "Vídeo completo",
            targetPse: "8",
            videoUrl: "https://www.youtube.com/watch?v=L_oYngbAwCk&t=34s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-5",
    title: "Cardio 5 - Forte",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado de intensidade mais alta.",
    blocks: [
      {
        id: "cardio-5-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-5-video-completo",
            name: "Cardio 5 - Forte",
            time: "Vídeo completo",
            targetPse: "8",
            videoUrl: "https://www.youtube.com/watch?v=S5csKnuU5Qs&t=39s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "cardio-6",
    title: "Cardio 6 - Finalizador",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Cardio guiado curto para finalizar a sessão.",
    blocks: [
      {
        id: "cardio-6-sequencia",
        title: "Sequência completa",
        type: "cardio",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "cardio-6-video-completo",
            name: "Cardio 6 - Finalizador",
            time: "Vídeo completo",
            targetPse: "8",
            videoUrl: "https://www.youtube.com/watch?v=LseztLoFhVg",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
  {
    id: "anti-lesao",
    title: "Anti-lesão - Prevenção",
    month: "Abril",
    year: 2026,
    type: "complementary",
    description: "Sequência guiada de prevenção e cuidado articular.",
    blocks: [
      {
        id: "anti-lesao-sequencia",
        title: "Sequência completa",
        type: "mobility",
        sets: "1x",
        order: 1,
        items: [
          {
            id: "anti-lesao-video-completo",
            name: "Anti-lesão - Prevenção",
            time: "Vídeo completo",
            targetPse: "5",
            videoUrl: "https://www.youtube.com/watch?v=ChMCRY8cE6U&t=1s",
            notes: "Registrar a execução do complementar completo.",
          },
        ],
      },
    ],
  },
];
