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
  
  // 2. Rollover Logic: If Somalia local time is before 4 AM, it belongs to previous day
  const resultDate = new Date(somaliaTime.getTime())
  if (somaliaTime.getUTCHours() < 4) {
    resultDate.setUTCDate(resultDate.getUTCDate() - 1)
  }
  
  return resultDate.toISOString().split('T')[0]
}

/**
 * Returns the current Work Date based on current time.
 */
export function getCurrentWorkDate(): string {
  return getWorkDate(new Date())
}
