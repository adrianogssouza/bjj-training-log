import { formatTodayHeaderDate } from "@/lib/date-utils";

export function TodayHeader() {
  const formattedDate = formatTodayHeaderDate();

  return (
    <header className="space-y-1">
      <h1 className="text-[28px] font-extrabold leading-[34px] text-[#F4F4F5]">
        Hoje
      </h1>
      <p className="text-[16px] font-normal leading-[24px] text-[#A1A1AA]">
        {formattedDate}
      </p>
    </header>
  );
}
