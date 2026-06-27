/**
 * Handles the logic for "Work Day" rollover.
 * Shift starting on Monday might end at 1 AM Tuesday.
 * Those early Tuesday transactions (before 1:00 AM) are Monday's work.
 * 
 * Rollover Hour: 1:00 AM
 */

export function getWorkDate(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  
  // 1. Convert to Somalia Time (UTC+3)
  const somaliaTime = new Date(date.getTime() + (3 * 60 * 60 * 1000))
  
  // 2. 1:00 AM Rollover: Any time before 1:00 AM is pulled back to the previous work day
  const resultDate = new Date(somaliaTime.getTime() - (1 * 60 * 60 * 1000))
  
  return resultDate.toISOString().split('T')[0]
}

/**
 * Returns the current Work Date based on current time.
 */
export function getCurrentWorkDate(): string {
  return getWorkDate(new Date())
}

/**
 * Returns the exact UTC bounds (start and end) for a given Somalia work date (UTC+3)
 * with a 1:00 AM rollover.
 * Example: For '2026-05-30', start is '2026-05-29T22:00:00.000Z' (which is 2026-05-30T01:00:00.000 local)
 * and end is '2026-05-30T21:59:59.999Z' (which is 2026-05-31T00:59:59.999 local).
 */
export function getWorkDayBounds(dateStr: string): { startOfDay: string, endOfDay: string } {
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`)
  // Subtract 2 hours from UTC midnight to get 1:00 AM Somalia time of that day (-3 hours local offset + 1 hour rollover)
  const startUtcTime = dateObj.getTime() - (2 * 60 * 60 * 1000)
  const startOfDay = new Date(startUtcTime).toISOString()
  const endUtcTime = startUtcTime + (24 * 60 * 60 * 1000) - 1
  const endOfDay = new Date(endUtcTime).toISOString()
  
  return { startOfDay, endOfDay }
}
