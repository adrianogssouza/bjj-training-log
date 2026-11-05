import type { SelectHTMLAttributes } from "react";

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function AppSelect({
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  children,
  ...props
}: AppSelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = error && selectId ? `${selectId}-error` : undefined;
  const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-[14px] font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          className={`w-full min-h-[48px] appearance-none rounded-[10px] border bg-[var(--surface-elevated)] px-3.5 py-2.5 pr-10 text-[16px] text-[var(--foreground)] transition-colors focus:border-[var(--focus)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-[var(--primary-hover)]" : "border-[var(--border)]"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted)]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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
