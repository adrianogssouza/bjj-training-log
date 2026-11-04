"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AppIcon } from "./AppIcon";

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  isDestructive?: boolean;
  maxWidth?: string; // e.g. "max-w-[560px]"
  className?: string;
}

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  isDestructive = false,
  maxWidth = "max-w-[560px]",
  className = "",
}: AppModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = "app-modal-title";
  const descId = "app-modal-description";

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus initial focusable element or modal container
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isDestructive) {
          e.preventDefault();
          onClose();
        }
      } else if (e.key === "Tab") {
        // Focus trap
        if (!modalRef.current) return;
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === "function") {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, isDestructive, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      onClick={() => {
        if (!isDestructive) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} rounded-t-[20px] sm:rounded-[20px] border border-[#3F3F46] bg-[#18181B] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 text-[#F4F4F5] shadow-2xl focus:outline-none ${className}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#3F3F46] pb-3">
          <div>
            <h2 id={titleId} className="text-[20px] font-bold leading-[28px] text-[#F4F4F5]">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[14px] font-normal leading-[21px] text-[#A1A1AA]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
          >
            <AppIcon name="close" size={20} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
