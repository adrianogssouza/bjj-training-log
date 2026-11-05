/**
 * Temas visuais do app. A escolha fica salva neste dispositivo (localStorage)
 * e é aplicada em <html data-theme="..."> antes da primeira pintura
 * pelo script em `THEME_BOOT_SCRIPT` (ver src/app/layout.tsx).
 */

export type ThemeKey = "carvao" | "lima" | "ciano" | "dourado";

export type ThemeOption = {
  key: ThemeKey;
  name: string;
  description: string;
  /** Fundo, superfície e destaque — usados na prévia do seletor. */
  swatches: [string, string, string];
  themeColor: string;
};

export const THEME_STORAGE_KEY = "bjj-training-log:theme";
export const DEFAULT_THEME: ThemeKey = "carvao";
export const THEME_EVENT = "bjj-theme-updated";

export const THEMES: ThemeOption[] = [
  {
    key: "carvao",
    name: "Carvão · Vermelho",
    description: "A linha atual, mais refinada: contraste alto e destaque vermelho.",
    swatches: ["#0a0a0c", "#1f1f23", "#dc2626"],
    themeColor: "#0a0a0c",
  },
  {
    key: "lima",
    name: "Preto · Verde-limão",
    description: "Preto total com destaque neon e títulos condensados.",
    swatches: ["#000000", "#181a13", "#c6f432"],
    themeColor: "#000000",
  },
  {
    key: "ciano",
    name: "Azul-noite · Ciano",
    description: "Azul bem escuro com ciano, no estilo de relógio esportivo.",
    swatches: ["#050b16", "#142139", "#22d3ee"],
    themeColor: "#050b16",
  },
  {
    key: "dourado",
    name: "Grafite · Dourado",
    description: "Tons quentes de grafite com detalhes dourados. Premium e sóbrio.",
    swatches: ["#121110", "#26231f", "#d4a24c"],
    themeColor: "#121110",
  },
];

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && THEMES.some((theme) => theme.key === value);
}

export function readStoredTheme(): ThemeKey {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeKey(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(key: ThemeKey, persist = true) {
  const theme = THEMES.find((option) => option.key === key) ?? THEMES[0];
  document.documentElement.dataset.theme = theme.key;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", theme.themeColor));
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme.key);
    } catch {
      // Sem armazenamento: o tema vale só até recarregar a página.
    }
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Executado no <head>, antes do React, para evitar o "piscar" do tema padrão. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var ok=${JSON.stringify(THEMES.map((t) => t.key))};var c=${JSON.stringify(
  Object.fromEntries(THEMES.map((t) => [t.key, t.themeColor])),
)};if(ok.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c[t]);}}catch(e){}})();`;
