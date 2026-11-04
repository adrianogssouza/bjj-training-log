/**
 * Utilitários de data e hora para fuso horário de São Paulo (America/Sao_Paulo)
 */

export function getSaoPauloDate(dateInput: Date | string | number = new Date()): Date {
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour || 0),
    Number(map.minute || 0),
    Number(map.second || 0)
  );
}

/**
 * Formata data corrente para o cabeçalho da Home:
 * Ex: "Quarta-feira, 4 de novembro"
 */
export function formatTodayHeaderDate(date = new Date()): string {
  const d = getSaoPauloDate(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(date);

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
  }).format(date);

  return `${capitalizedWeekday}, ${day} de ${month}`;
}

/**
 * Retorna os limites da semana (segunda-feira 00:00:00 até domingo 23:59:59)
 * no fuso de São Paulo.
 */
export function getSaoPauloWeekRange(date = new Date()): {
  start: Date;
  end: Date;
  startIsoDate: string;
  endIsoDate: string;
} {
  const spDate = getSaoPauloDate(date);
  const dayOfWeek = spDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  // Diferença para a segunda-feira anterior:
  const diffToMonday = (dayOfWeek + 6) % 7;

  const start = new Date(spDate);
  start.setDate(spDate.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const startIsoDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const endIsoDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  return { start, end, startIsoDate, endIsoDate };
}

/**
 * Formata data curta em pt-BR (ex: "4 de nov.")
 */
export function formatShortDatePTBR(dateInput: Date | string | number): string {
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "short",
  }).format(date);
}
