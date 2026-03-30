import { CalendarEvent } from '@/types';

/**
 * Get a full-week date grid for a month calendar view.
 * Returns 4-6 weeks (28/35/42 dates), starting on Sunday and ending on Saturday.
 */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  const endDate = new Date(lastDay);

  // Go back to the previous Sunday (or stay if already Sunday)
  const dayOfWeek = firstDay.getDay();
  startDate.setDate(firstDay.getDate() - dayOfWeek);

  // Go forward to the next Saturday (or stay if already Saturday)
  const lastDayOfWeek = lastDay.getDay();
  endDate.setDate(lastDay.getDate() + (6 - lastDayOfWeek));

  const grid: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    grid.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return grid;
}

/**
 * Get 7 dates for a week (Sunday to Saturday)
 */
export function getWeekDates(date: Date): Date[] {
  const startOfWeek = new Date(date);
  const dayOfWeek = date.getDay();
  startOfWeek.setDate(date.getDate() - dayOfWeek);

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(new Date(startOfWeek));
    startOfWeek.setDate(startOfWeek.getDate() + 1);
  }

  return weekDates;
}

/**
 * Format time as "h:mm AM/PM", optionally in a specific IANA timezone.
 * When timezone is provided, the time is shown in that timezone rather than device local time.
 * This ensures Google Calendar events (which may be in UTC or a non-local timezone) display correctly.
 */
export function formatTime(date: Date, timezone?: string): string {
  let hours: number;
  let minutes: number;

  if (timezone) {
    try {
      // Format in the event's timezone using a 24-hour clock, then parse hours/minutes
      const str = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date); // e.g. "06:00" or "18:30"
      const [h, m] = str.split(':').map(Number);
      // Some Intl implementations can emit "24" for midnight; normalize to 0-23.
      hours = h % 24;
      minutes = m;
    } catch {
      hours = date.getHours();
      minutes = date.getMinutes();
    }
  } else {
    hours = date.getHours();
    minutes = date.getMinutes();
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format date range as "h:mm AM - h:mm PM" or "All Day"
 */
export function formatDateRange(start: Date, end: Date, isAllDay: boolean, timezone?: string): string {
  if (isAllDay) {
    return 'All Day';
  }

  return `${formatTime(start, timezone)} - ${formatTime(end, timezone)}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get events that occur on a specific day
 */
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(event => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Event overlaps this day if it starts before day ends AND ends after day starts.
    // This correctly handles same-day, overnight, multi-day, and all-day events.
    return startDate < dayEnd && endDate > dayStart;
  });
}

/**
 * Get events that occur during a week
 */
export function getEventsForWeek(events: CalendarEvent[], weekStart: Date): CalendarEvent[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return events.filter(event => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    return (startDate >= weekStart && startDate < weekEnd) ||
           (endDate > weekStart && endDate <= weekEnd) ||
           (startDate < weekStart && endDate > weekEnd);
  });
}

/**
 * Calculate top offset in pixels for an event on a time grid
 * Assumes 60px per hour, grid starts at midnight
 */
export function getEventTopOffset(startTime: Date, timezone?: string): number {
  let hours: number;
  let minutes: number;

  if (timezone) {
    try {
      const str = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(startTime);
      const [h, m] = str.split(':').map(Number);
      // Keep timezone-derived hours in 0-23 even if Intl emits 24 for midnight.
      hours = h % 24;
      minutes = m;
    } catch {
      hours = startTime.getHours();
      minutes = startTime.getMinutes();
    }
  } else {
    hours = startTime.getHours();
    minutes = startTime.getMinutes();
  }

  return (hours * 60) + minutes; // 1px per minute
}

/**
 * Calculate height in pixels for an event on a time grid
 */
export function getEventHeight(startTime: Date, endTime: Date): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  return Math.max(durationMinutes, 30); // Minimum 30px
}

/**
 * Get month name from month index (0-11)
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Get short day name from day index (0-6, Sunday = 0)
 */
export function getDayName(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
}

/**
 * Get events happening today
 */
export function getEventsForToday(events: CalendarEvent[]): CalendarEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return events.filter(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    return (startTime >= today && startTime < tomorrow) ||
           (endTime > today && endTime <= tomorrow) ||
           (startTime < today && endTime > tomorrow);
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get events happening tomorrow
 */
export function getEventsForTomorrow(events: CalendarEvent[]): CalendarEvent[] {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  return events.filter(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    return (startTime >= tomorrow && startTime < dayAfter) ||
           (endTime > tomorrow && endTime <= dayAfter) ||
           (startTime < tomorrow && endTime > dayAfter);
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get events happening in the next 7 days (excluding today and tomorrow)
 */
export function getEventsThisWeek(events: CalendarEvent[]): CalendarEvent[] {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const weekEnd = new Date(dayAfterTomorrow);
  weekEnd.setDate(weekEnd.getDate() + 5); // Next 5 days after tomorrow

  return events.filter(event => {
    const startTime = new Date(event.startTime);
    return startTime >= dayAfterTomorrow && startTime < weekEnd;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get all future events starting from the day after tomorrow, sorted by start time
 */
export function getFutureEvents(events: CalendarEvent[]): CalendarEvent[] {
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return events.filter(event => {
    const startTime = new Date(event.startTime);
    return startTime >= dayAfterTomorrow;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Format date section header ("Today", "Tomorrow", or "Wed, Feb 14")
 */
export function formatDateSectionHeader(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (checkDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    const dayName = getDayName(date.getDay());
    const monthName = getMonthName(date.getMonth());
    return `${dayName}, ${monthName} ${date.getDate()}`;
  }
}
