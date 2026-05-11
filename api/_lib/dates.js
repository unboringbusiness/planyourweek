// Get the Monday-based week start for a given date
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Convert "monday" -> 1, "tuesday" -> 2, etc.
export function dayNameToIndex(name) {
  return DAY_NAMES.indexOf(name.toLowerCase())
}
