const DAY = 86400_000;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function daysTogether(start: string, current = today()) {
  return Math.max(0, Math.floor((Date.parse(current) - Date.parse(start)) / DAY) + 1);
}
export function countdown(date: string, yearly: boolean, current = today()) {
  const now = new Date(`${current}T00:00:00Z`),
    original = new Date(`${date}T00:00:00Z`);
  let next = original;
  if (yearly) {
    const occurrence = (year: number) => {
      const last = new Date(Date.UTC(year, original.getUTCMonth() + 1, 0)).getUTCDate();
      return new Date(
        Date.UTC(year, original.getUTCMonth(), Math.min(original.getUTCDate(), last)),
      );
    };
    next = occurrence(now.getUTCFullYear());
    if (next < now) next = occurrence(now.getUTCFullYear() + 1);
  }
  return Math.round((next.getTime() - now.getTime()) / DAY);
}
