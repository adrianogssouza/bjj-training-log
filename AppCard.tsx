import type { ReactNode } from "react";

type AppCardProps = {
  children: ReactNode;
  className?: string;
};

export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <section
      className={`rounded-lg border border-zinc-800 bg-zinc-950/80 p-5 shadow-sm shadow-black/20 ${className}`}
    >
      {children}
    </section>
  );
}
