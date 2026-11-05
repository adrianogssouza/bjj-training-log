import type { TextareaHTMLAttributes } from "react";

export interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function AppTextarea({
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  rows = 3,
  ...props
}: AppTextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = error && textareaId ? `${textareaId}-error` : undefined;
  const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-[14px] font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={`w-full rounded-[10px] border bg-[var(--surface-elevated)] p-3 text-[16px] text-[var(--foreground)] placeholder-[var(--muted)] transition-colors focus:border-[var(--focus)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-[var(--primary-hover)]" : "border-[var(--border)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-[var(--primary-text)]" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-[13px] text-[var(--muted)]">
          {helperText}
        </p>
      )}
    </div>
  );
}
