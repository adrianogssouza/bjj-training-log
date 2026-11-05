"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type IconName } from "@/components/ui/AppIcon";

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Hoje",
    href: "/",
    icon: "home",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    name: "Treinos",
    href: "/workouts",
    icon: "dumbbell",
    isActive: (pathname: string) =>
      pathname.startsWith("/workouts") && !pathname.endsWith("/start"),
  },
  {
    name: "Bike",
    href: "/bike",
    icon: "bike",
    isActive: (pathname: string) => pathname.startsWith("/bike"),
  },
  {
    name: "Histórico",
    href: "/history",
    icon: "history",
    isActive: (pathname: string) => pathname.startsWith("/history"),
  },
];

export function PrimaryNavigation({ currentPath }: { currentPath?: string } = {}) {
  const routerPath = usePathname();
  const pathname = currentPath || routerPath || "/";

  // Hide bottom navigation during guided workout execution
  const isGuidedWorkout =
    pathname.startsWith("/workouts/") && pathname.endsWith("/start");

  if (isGuidedWorkout) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 block border-t border-[var(--border)] bg-[var(--background)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex h-[64px] max-w-[960px] items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-[10px] my-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                active
                  ? "bg-[var(--primary-soft)] text-[var(--foreground)]"
                  : "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className={active ? "text-[var(--primary-text)]" : "text-current"}>
                <AppIcon name={item.icon} size={22} />
              </span>
              <span className="text-[13px] font-medium leading-[16px]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
