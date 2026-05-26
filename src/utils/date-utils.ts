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
