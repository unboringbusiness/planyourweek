const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Returns the Sunday of the week containing the given date. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day); // Sunday = day 0, no shift needed
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns an array of 7 Date objects from Monday to Sunday. */
export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Returns a string like "Apr 21 – Apr 27". */
export function formatWeekRange(weekStart) {
  const days = getWeekDays(weekStart);
  const start = days[0];
  const end = days[6];
  const fmt = (d) => `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Returns 0 for Monday through 6 for Sunday. */
export function getDayIndex(date) {
  const day = new Date(date).getDay();
  return day === 0 ? 6 : day - 1;
}

/** Returns true if the given date is today. */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/** Returns the Sunday of the current week as 'YYYY-MM-DD' (local date, not UTC). */
export function getCurrentWeekStart() {
  const d = new Date()
  const day = d.getDay() // 0 = Sunday, so subtract day to get Sunday
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dt = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dt}`
}
