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
          className="mb-2 block text-[14px] font-medium text-[#F4F4F5]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={`w-full min-h-[48px] rounded-[10px] border bg-[#27272A] px-3.5 py-2.5 text-[16px] text-[#F4F4F5] placeholder-[#A1A1AA] transition-colors focus:border-[#93C5FD] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-[#B91C1C]" : "border-[#3F3F46]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-[#FCA5A5]" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-[13px] text-[#A1A1AA]">
          {helperText}
        </p>
      )}
    </div>
  );
}
