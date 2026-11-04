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
          className="mb-2 block text-[14px] font-medium text-[#F4F4F5]"
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
        className={`w-full rounded-[10px] border bg-[#27272A] p-3 text-[16px] text-[#F4F4F5] placeholder-[#A1A1AA] transition-colors focus:border-[#93C5FD] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50 ${
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
