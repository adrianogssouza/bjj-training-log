import type { InputHTMLAttributes } from "react";

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function AppInput({
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  ...props
}: AppInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-[14px] font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={`w-full min-h-[48px] rounded-[10px] border bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] placeholder-[var(--muted)] transition-colors focus:border-[var(--focus)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-50 ${
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
