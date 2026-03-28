import {
  getEventsForDay,
  getEventsForWeek,
  getEventTopOffset,
  getEventHeight,
  getEventsForToday,
  getEventsForTomorrow,
  getEventsThisWeek,
  formatDateSectionHeader,
  getMonthName,
  getDayName,
} from '@/utils/date-helpers';
import type { CalendarEvent } from '@/types';

// Minimal event factory
function makeEvent(startTime: string, endTime: string, id = 'e1'): CalendarEvent {
  return {
    id,
    calendarId: 'cal-1',
    title: 'Test',
    startTime,
    endTime,
    isAllDay: false,
    timezone: 'UTC',
    status: 'confirmed',
    reminders: [],
    invitedUserIds: [],
    createdBy: 'user-1',
    createdAt: startTime,
    updatedAt: startTime,
  };
}

// ── getEventsForDay ──────────────────────────────────────────────────────────

describe('getEventsForDay', () => {
  // Use local time to avoid timezone offset issues with the date comparison logic
  const day = new Date(2026, 2, 23); // March 23 local time

  it('returns events that start on the given day', () => {
    const start = new Date(2026, 2, 23, 10, 0, 0);
    const end = new Date(2026, 2, 23, 11, 0, 0);
    const event = makeEvent(start.toISOString(), end.toISOString());
    expect(getEventsForDay([event], day)).toHaveLength(1);
  });

  it('excludes events on a different day', () => {
    const start = new Date(2026, 2, 24, 10, 0, 0);
    const end = new Date(2026, 2, 24, 11, 0, 0);
    const event = makeEvent(start.toISOString(), end.toISOString());
    expect(getEventsForDay([event], day)).toHaveLength(0);
  });

  it('includes multi-day events that span the given day', () => {
    const start = new Date(2026, 2, 22, 20, 0, 0);
    const end = new Date(2026, 2, 24, 8, 0, 0);
    const event = makeEvent(start.toISOString(), end.toISOString());
    expect(getEventsForDay([event], day)).toHaveLength(1);
  });

  it('returns empty array when no events', () => {
    expect(getEventsForDay([], day)).toHaveLength(0);
  });

  it('handles multiple events correctly', () => {
    const e1 = makeEvent(new Date(2026, 2, 23, 9).toISOString(), new Date(2026, 2, 23, 10).toISOString(), 'e1');
    const e2 = makeEvent(new Date(2026, 2, 23, 14).toISOString(), new Date(2026, 2, 23, 15).toISOString(), 'e2');
    const e3 = makeEvent(new Date(2026, 2, 24, 9).toISOString(), new Date(2026, 2, 24, 10).toISOString(), 'e3');
    expect(getEventsForDay([e1, e2, e3], day)).toHaveLength(2);
  });
});

// ── getEventsForWeek ─────────────────────────────────────────────────────────

describe('getEventsForWeek', () => {
  const weekStart = new Date('2026-03-23T00:00:00.000Z');

  it('includes event starting within the week', () => {
    const event = makeEvent('2026-03-25T10:00:00.000Z', '2026-03-25T11:00:00.000Z');
    expect(getEventsForWeek([event], weekStart)).toHaveLength(1);
  });

  it('excludes event starting after the week', () => {
    const event = makeEvent('2026-03-31T10:00:00.000Z', '2026-03-31T11:00:00.000Z');
    expect(getEventsForWeek([event], weekStart)).toHaveLength(0);
  });

  it('includes event spanning across the entire week', () => {
    const event = makeEvent('2026-03-20T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
    expect(getEventsForWeek([event], weekStart)).toHaveLength(1);
  });

  it('includes event ending within the week', () => {
    const event = makeEvent('2026-03-20T10:00:00.000Z', '2026-03-24T10:00:00.000Z');
    expect(getEventsForWeek([event], weekStart)).toHaveLength(1);
  });

  it('returns empty for no events', () => {
    expect(getEventsForWeek([], weekStart)).toHaveLength(0);
  });
});

// ── getEventTopOffset ────────────────────────────────────────────────────────

describe('getEventTopOffset', () => {
  it('returns 0 for midnight', () => {
    const d = new Date('2026-03-23T00:00:00');
    expect(getEventTopOffset(d)).toBe(0);
  });

  it('returns 60 for 1:00 AM', () => {
    const d = new Date('2026-03-23T01:00:00');
    expect(getEventTopOffset(d)).toBe(60);
  });

  it('returns 540 for 9:00 AM', () => {
    const d = new Date('2026-03-23T09:00:00');
    expect(getEventTopOffset(d)).toBe(540);
  });

  it('returns hours*60 + minutes', () => {
    const d = new Date('2026-03-23T14:30:00');
    expect(getEventTopOffset(d)).toBe(14 * 60 + 30);
  });
});

// ── getEventHeight ───────────────────────────────────────────────────────────

describe('getEventHeight', () => {
  it('returns 60 for 1-hour event', () => {
    const start = new Date('2026-03-23T09:00:00');
    const end = new Date('2026-03-23T10:00:00');
    expect(getEventHeight(start, end)).toBe(60);
  });

  it('returns 30 minimum for very short events', () => {
    const start = new Date('2026-03-23T09:00:00');
    const end = new Date('2026-03-23T09:05:00');
    expect(getEventHeight(start, end)).toBe(30);
  });

  it('returns exact minutes for 90-minute event', () => {
    const start = new Date('2026-03-23T09:00:00');
    const end = new Date('2026-03-23T10:30:00');
    expect(getEventHeight(start, end)).toBe(90);
  });
});

// ── getEventsForToday ────────────────────────────────────────────────────────

describe('getEventsForToday', () => {
  it('returns events that start today', () => {
    const now = new Date();
    now.setHours(10, 0, 0, 0);
    const end = new Date(now);
    end.setHours(11);
    const event = makeEvent(now.toISOString(), end.toISOString());
    expect(getEventsForToday([event])).toHaveLength(1);
  });

  it('excludes events from yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(11);
    const event = makeEvent(yesterday.toISOString(), end.toISOString());
    expect(getEventsForToday([event])).toHaveLength(0);
  });

  it('sorts results by start time', () => {
    const now = new Date();
    const late = new Date(now);
    late.setHours(15, 0, 0, 0);
    const early = new Date(now);
    early.setHours(8, 0, 0, 0);
    const lateEnd = new Date(late); lateEnd.setHours(16);
    const earlyEnd = new Date(early); earlyEnd.setHours(9);
    const e1 = makeEvent(late.toISOString(), lateEnd.toISOString(), 'late');
    const e2 = makeEvent(early.toISOString(), earlyEnd.toISOString(), 'early');
    const result = getEventsForToday([e1, e2]);
    expect(result[0].id).toBe('early');
  });

  it('returns empty for no events', () => {
    expect(getEventsForToday([])).toHaveLength(0);
  });

  it('includes events that end today (started yesterday)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(22, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(6, 0, 0, 0);
    const event = makeEvent(yesterday.toISOString(), endToday.toISOString());
    expect(getEventsForToday([event])).toHaveLength(1);
  });

  it('includes events that span all of today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const event = makeEvent(yesterday.toISOString(), tomorrow.toISOString());
    expect(getEventsForToday([event])).toHaveLength(1);
  });
});

// ── getEventsForTomorrow ─────────────────────────────────────────────────────

describe('getEventsForTomorrow', () => {
  it('returns events that start tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(11);
    const event = makeEvent(tomorrow.toISOString(), end.toISOString());
    expect(getEventsForTomorrow([event])).toHaveLength(1);
  });

  it('excludes events that start today', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const end = new Date(today);
    end.setHours(11);
    const event = makeEvent(today.toISOString(), end.toISOString());
    expect(getEventsForTomorrow([event])).toHaveLength(0);
  });

  it('returns empty for no events', () => {
    expect(getEventsForTomorrow([])).toHaveLength(0);
  });

  it('includes events that end tomorrow (started today)', () => {
    const today = new Date();
    today.setHours(20, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    const event = makeEvent(today.toISOString(), tomorrow.toISOString());
    expect(getEventsForTomorrow([event])).toHaveLength(1);
  });

  it('includes events that span all of tomorrow', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(12, 0, 0, 0);
    const event = makeEvent(today.toISOString(), dayAfter.toISOString());
    expect(getEventsForTomorrow([event])).toHaveLength(1);
  });

  it('sorts multiple tomorrow events by start time', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const late = new Date(tomorrow); late.setHours(15, 0, 0, 0);
    const early = new Date(tomorrow); early.setHours(8, 0, 0, 0);
    const lateEnd = new Date(late); lateEnd.setHours(16);
    const earlyEnd = new Date(early); earlyEnd.setHours(9);
    const e1 = makeEvent(late.toISOString(), lateEnd.toISOString(), 'late');
    const e2 = makeEvent(early.toISOString(), earlyEnd.toISOString(), 'early');
    const result = getEventsForTomorrow([e1, e2]);
    expect(result[0].id).toBe('early');
    expect(result[1].id).toBe('late');
  });
});

// ── getEventsThisWeek ────────────────────────────────────────────────────────

describe('getEventsThisWeek', () => {
  it('returns events 2-6 days from now', () => {
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    threeDays.setHours(10, 0, 0, 0);
    const end = new Date(threeDays);
    end.setHours(11);
    const event = makeEvent(threeDays.toISOString(), end.toISOString());
    expect(getEventsThisWeek([event])).toHaveLength(1);
  });

  it('excludes events starting today', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const end = new Date(today);
    end.setHours(11);
    const event = makeEvent(today.toISOString(), end.toISOString());
    expect(getEventsThisWeek([event])).toHaveLength(0);
  });

  it('excludes events starting tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(11);
    const event = makeEvent(tomorrow.toISOString(), end.toISOString());
    expect(getEventsThisWeek([event])).toHaveLength(0);
  });

  it('returns empty for no events', () => {
    expect(getEventsThisWeek([])).toHaveLength(0);
  });

  it('sorts multiple this-week events by start time', () => {
    const base = new Date();
    const late = new Date(base); late.setDate(late.getDate() + 5); late.setHours(15, 0, 0, 0);
    const early = new Date(base); early.setDate(early.getDate() + 3); early.setHours(8, 0, 0, 0);
    const lateEnd = new Date(late); lateEnd.setHours(16);
    const earlyEnd = new Date(early); earlyEnd.setHours(9);
    const e1 = makeEvent(late.toISOString(), lateEnd.toISOString(), 'late');
    const e2 = makeEvent(early.toISOString(), earlyEnd.toISOString(), 'early');
    const result = getEventsThisWeek([e1, e2]);
    expect(result[0].id).toBe('early');
    expect(result[1].id).toBe('late');
  });
});

// ── formatDateSectionHeader ──────────────────────────────────────────────────

describe('formatDateSectionHeader', () => {
  it('returns "Today" for today', () => {
    expect(formatDateSectionHeader(new Date())).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDateSectionHeader(tomorrow)).toBe('Tomorrow');
  });

  it('returns formatted date for other days', () => {
    const date = new Date('2026-03-25T12:00:00');
    const result = formatDateSectionHeader(date);
    expect(result).toMatch(/Wed/);
    expect(result).toMatch(/March/);
    expect(result).toMatch(/25/);
  });
});

// ── getMonthName / getDayName ────────────────────────────────────────────────

describe('getMonthName', () => {
  it('returns correct month names', () => {
    expect(getMonthName(0)).toBe('January');
    expect(getMonthName(11)).toBe('December');
    expect(getMonthName(5)).toBe('June');
  });
});

describe('getDayName', () => {
  it('returns correct day names', () => {
    expect(getDayName(0)).toBe('Sun');
    expect(getDayName(6)).toBe('Sat');
    expect(getDayName(3)).toBe('Wed');
  });
});
