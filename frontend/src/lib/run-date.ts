function parseRunDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

export function formatRunDate(value: string) {
  if (value.startsWith("Bugün") || value.startsWith("Dün")) return value;
  const date = parseRunDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function runIsWithinDays(value: string, days: number) {
  if (value.startsWith("Bugün")) return true;
  if (value.startsWith("Dün")) return days >= 2;
  const date = parseRunDate(value);
  if (!date) return false;
  const age = Date.now() - date.getTime();
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}
