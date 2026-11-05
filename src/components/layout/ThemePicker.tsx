"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppModal } from "@/components/ui/AppModal";
import {
  THEMES,
  THEME_EVENT,
  applyTheme,
  readStoredTheme,
  type ThemeKey,
} from "@/lib/theme";

/** Botão do cabeçalho que abre o seletor de aparência. */
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeKey>("carvao");

  useEffect(() => {
    const sync = () => setCurrent(readStoredTheme());
    // Garante que a cor da barra do navegador acompanhe o tema salvo.
    applyTheme(readStoredTheme(), false);
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Aparência do app"
        title="Aparência"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
      >
        <AppIcon name="contrast" size={20} />
      </button>

      {/* O cabeçalho é "sticky" e cria um contexto de empilhamento:
          o modal vai para o <body> para ficar acima da navegação inferior. */}
      {open && createPortal(
      <AppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Aparência"
        description="Escolha o visual do app neste dispositivo. Todas as opções são escuras."
      >
        <div className="grid gap-2" role="radiogroup" aria-label="Tema">
          {THEMES.map((theme) => {
            const selected = theme.key === current;
            return (
              <button
                key={theme.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  applyTheme(theme.key);
                  setCurrent(theme.key);
                }}
                className={`flex items-center gap-3.5 rounded-[14px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                  selected
                    ? "border-[var(--primary-hover)] bg-[var(--primary-tint)]"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-white/15"
                >
                  {theme.swatches.map((color) => (
                    <span key={color} className="flex-1" style={{ background: color }} />
                  ))}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[16px] font-extrabold text-[var(--foreground)]">
                    {theme.name}
                  </span>
                  <span className="text-[13px] leading-[18px] text-[var(--muted)]">
                    {theme.description}
                  </span>
                </span>
                {selected && (
                  <AppIcon name="check" size={22} className="shrink-0 text-[var(--primary-text)]" />
                )}
              </button>
            );
          })}
        </div>
      </AppModal>,
      document.body,
      )}
    </>
  );
}
