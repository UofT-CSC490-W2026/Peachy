/**
 * Calendar utility functions and constants
 */

/**
 * Default calendar color mapping
 * Maps calendar IDs to their colors for consistent display across the app
 */
export const CALENDAR_COLORS: Record<string, string> = {
  'cal-1': '#FF8C6B', // Personal (peachy)
  'cal-2': '#4A90E2', // Work (blue)
  'cal-3': '#9B59B6', // Family (purple)
  'cal-4': '#2ECC71', // Fitness (green)
};

/**
 * Get color for a calendar by ID
 * Falls back to default peachy color if calendar not found
 */
export function getCalendarColor(calendarId: string): string {
  return CALENDAR_COLORS[calendarId] || '#FF8C6B';
}
