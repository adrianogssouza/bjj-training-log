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

export function PrimaryNavigation() {
  const pathname = usePathname() || "/";

  // Hide bottom navigation during guided workout execution
  const isGuidedWorkout =
    pathname.startsWith("/workouts/") && pathname.endsWith("/start");

  if (isGuidedWorkout) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 block border-t border-[#3F3F46] bg-[#09090B] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex h-[64px] max-w-[960px] items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-[10px] my-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                active
                  ? "bg-[#450A0A] text-[#F4F4F5]"
                  : "bg-transparent text-[#A1A1AA] hover:text-[#F4F4F5]"
              }`}
            >
              <span className={active ? "text-[#FCA5A5]" : "text-current"}>
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
