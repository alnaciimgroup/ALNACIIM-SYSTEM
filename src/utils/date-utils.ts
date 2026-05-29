/**
 * Handles the logic for "Work Day" rollover.
 * In many distribution businesses, a shift starting on Monday might end at 2 AM Tuesday.
 * Those early Tuesday transactions should be audited as Monday's work.
 * 
 * Rollover Hour: 4:00 AM
 */

export function getWorkDate(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  
  // 1. Convert to Somalia Time (UTC+3)
  // We use the UTC timestamp and add 3 hours. 
  // This helps us accurately determine the "Work Day" based on Somalia's local schedule.
  const somaliaTime = new Date(date.getTime() + (3 * 60 * 60 * 1000))
  
  // Removed 4 AM rollover: The date strictly rolls over at 12:00 AM midnight.
  const resultDate = new Date(somaliaTime.getTime())
  
  return resultDate.toISOString().split('T')[0]
}

/**
 * Returns the current Work Date based on current time.
 */
export function getCurrentWorkDate(): string {
  return getWorkDate(new Date())
}

/**
 * Returns the exact UTC bounds (start and end) for a given Somalia work date (UTC+3).
 * Example: For '2026-05-30', start is '2026-05-29T21:00:00.000Z' and end is '2026-05-30T20:59:59.999Z'
 */
export function getWorkDayBounds(dateStr: string): { startOfDay: string, endOfDay: string } {
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`)
  const startUtcTime = dateObj.getTime() - (3 * 60 * 60 * 1000)
  const startOfDay = new Date(startUtcTime).toISOString()
  const endUtcTime = startUtcTime + (24 * 60 * 60 * 1000) - 1
  const endOfDay = new Date(endUtcTime).toISOString()
  
  return { startOfDay, endOfDay }
}
