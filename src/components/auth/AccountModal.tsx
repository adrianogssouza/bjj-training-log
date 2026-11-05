"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge, type AppBadgeVariant } from "@/components/ui/AppBadge";
import { AppInput } from "@/components/ui/AppInput";
import { clearWorkoutHistory } from "@/lib/workout-storage";

export interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string | null;
  syncStatus: string;
  syncMessage: string;
  onLogout?: () => void;
  onExportBackup?: () => void;
  onImportLegacy?: () => void;
  onImportJson?: (file: File) => void;
  onRefreshSync?: () => void;
  onResolveConflict?: () => void;
}

export function AccountModal({
  isOpen,
  onClose,
  email,
  syncStatus,
  syncMessage,
  onLogout,
  onExportBackup,
  onImportLegacy,
  onImportJson,
  onRefreshSync,
  onResolveConflict,
}: AccountModalProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [clearSuccessMessage, setClearSuccessMessage] = useState(false);

  // Sync status badge variant mapping
  let statusBadgeVariant: AppBadgeVariant = "neutral";
  let statusBadgeText = syncStatus || "Sem sincronização";

  if (syncStatus === "saved" || syncStatus === "Sincronizado") {
    statusBadgeVariant = "success";
    statusBadgeText = "Sincronizado";
  } else if (syncStatus === "saving" || syncStatus === "Salvando…") {
    statusBadgeVariant = "warning";
    statusBadgeText = "Salvando…";
  } else if (syncStatus === "conflict" || syncStatus === "Conflito entre dispositivos") {
    statusBadgeVariant = "danger";
    statusBadgeText = "Conflito entre dispositivos";
  } else if (syncStatus === "error") {
    statusBadgeVariant = "danger";
    statusBadgeText = "Erro de sincronização";
  }

  function handleConfirmClear() {
    if (deleteConfirmationText.trim() !== "APAGAR") return;
    clearWorkoutHistory();
    setDeleteConfirmationText("");
    setShowClearConfirm(false);
    setClearSuccessMessage(true);
    setTimeout(() => setClearSuccessMessage(false), 5000);
  }

  return (
    <>
      <AppModal
        isOpen={isOpen && !showClearConfirm}
        onClose={onClose}
        title="Minha conta"
        description="Gerenciamento de conta, sincronização e backups"
        maxWidth="max-w-[520px]"
      >
        <div className="space-y-5">
          {/* User & Sync Status Card */}
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 space-y-3">
            <div>
              <p className="text-[13px] font-medium text-[var(--muted)]">E-mail da conta</p>
              <p className="text-[16px] font-bold text-[var(--foreground)] break-all">
                {email || "Modo local (sem sincronização em nuvem)"}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[13px] font-medium text-[var(--muted)]">Status:</span>
              <AppBadge variant={statusBadgeVariant}>{statusBadgeText}</AppBadge>
            </div>
          </div>

          {/* Sync Alerts & Actions */}
          {(syncMessage || syncStatus === "error" || syncStatus === "conflict") && (
            <div
              role="alert"
              className="space-y-3 rounded-[12px] border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-4 text-[var(--foreground)]"
            >
              <p className="text-[14px] leading-[21px]">{syncMessage || "Atenção com a sincronização."}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {onExportBackup && (
                  <AppButton variant="secondary" onClick={onExportBackup}>
                    Exportar minha cópia local
                  </AppButton>
                )}
                {syncStatus === "conflict" && onResolveConflict ? (
                  <AppButton variant="primary" onClick={onResolveConflict}>
                    Carregar versão da nuvem
                  </AppButton>
                ) : onRefreshSync ? (
                  <AppButton variant="secondary" onClick={onRefreshSync}>
                    Tentar sincronizar
                  </AppButton>
                ) : null}
              </div>
            </div>
          )}

          {clearSuccessMessage && (
            <div
              role="status"
              className="rounded-[12px] border border-[var(--success)] bg-[var(--success)]/20 p-3 text-center text-[14px] font-medium text-[var(--success-text)]"
            >
              Histórico de musculação limpo com sucesso. Registros da bike foram preservados.
            </div>
          )}

          {/* Dados e Backup */}
          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <h3 className="text-[16px] font-bold text-[var(--foreground)]">Dados e backup</h3>
            <p className="text-[13px] leading-[18px] text-[var(--muted)]">
              Espere aparecer &quot;Sincronizado&quot; antes de continuar o treino em outro dispositivo.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              {onExportBackup && (
                <AppButton variant="secondary" onClick={onExportBackup} fullWidth>
                  Exportar backup
                </AppButton>
              )}

              {onImportLegacy && (
                <AppButton variant="secondary" onClick={onImportLegacy} fullWidth>
                  Importar registros antigos deste navegador
                </AppButton>
              )}

              {onImportJson && (
                <label className="flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-center text-base font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors focus-within:ring-2 focus-within:ring-[var(--focus)]">
                  Importar backup JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) onImportJson(file);
                    }}
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[var(--primary-hover)]/40 bg-transparent px-4 py-2 text-[14px] font-bold text-[var(--primary-text)] hover:bg-[var(--primary-soft)]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              >
                Limpar histórico de musculação
              </button>
            </div>
          </div>

          {/* Sair */}
          {onLogout && (
            <div className="border-t border-[var(--border)] pt-4">
              <AppButton variant="ghost" onClick={onLogout} fullWidth>
                Sair da conta
              </AppButton>
            </div>
          )}
        </div>
      </AppModal>

      {/* Protected Clear History Modal */}
      <AppModal
        isOpen={showClearConfirm}
        onClose={() => {
          setShowClearConfirm(false);
          setDeleteConfirmationText("");
        }}
        title="Limpar histórico de musculação"
        isDestructive={true}
        maxWidth="max-w-[480px]"
      >
        <div className="space-y-4">
          <p className="text-[14px] leading-[21px] text-[var(--muted)]">
            Esta operação remove todos os registros de musculação e complementares da sua conta sincronizada.
            <strong className="block mt-1 text-[var(--foreground)]">
              Os registros do módulo Bike Cardio não serão afetados.
            </strong>
          </p>

          {onExportBackup && (
            <div>
              <AppButton variant="secondary" onClick={onExportBackup} fullWidth>
                Exportar backup antes de apagar
              </AppButton>
            </div>
          )}

          <div className="rounded-[10px] border border-[var(--primary-hover)]/40 bg-[var(--primary-soft)]/30 p-3">
            <p className="text-[13px] text-[var(--primary-text)]">
              Para confirmar a exclusão definitiva, digite <span className="font-mono font-black text-white">APAGAR</span> abaixo:
            </p>
          </div>

          <AppInput
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="Digite APAGAR"
            aria-label="Confirmação de exclusão"
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
            <AppButton
              variant="secondary"
              onClick={() => {
                setShowClearConfirm(false);
                setDeleteConfirmationText("");
              }}
            >
              Cancelar
            </AppButton>
            <AppButton
              variant="danger"
              disabled={deleteConfirmationText.trim() !== "APAGAR"}
              onClick={handleConfirmClear}
            >
              Confirmar exclusão
            </AppButton>
          </div>
        </div>
      </AppModal>
    </>
  );
}
