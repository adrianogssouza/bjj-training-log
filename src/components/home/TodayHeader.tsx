import { formatTodayHeaderDate } from "@/lib/date-utils";

export function TodayHeader() {
  const formattedDate = formatTodayHeaderDate();

  return (
    <header className="space-y-1">
      <h1 className="text-[28px] font-extrabold leading-[34px] text-[var(--foreground)]">
        Hoje
      </h1>
      <p className="text-[16px] font-normal leading-[24px] text-[var(--muted)]">
        {formattedDate}
      </p>
    </header>
  );
}
