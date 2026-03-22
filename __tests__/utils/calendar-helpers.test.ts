import { getCalendarColor, CALENDAR_COLORS } from '@/utils/calendar-helpers';

describe('CALENDAR_COLORS', () => {
  it('contains exactly 4 entries', () => {
    expect(Object.keys(CALENDAR_COLORS)).toHaveLength(4);
  });

  it('maps all expected calendar IDs', () => {
    expect(CALENDAR_COLORS).toHaveProperty('cal-1');
    expect(CALENDAR_COLORS).toHaveProperty('cal-2');
    expect(CALENDAR_COLORS).toHaveProperty('cal-3');
    expect(CALENDAR_COLORS).toHaveProperty('cal-4');
  });

  it('values are valid hex color strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    Object.values(CALENDAR_COLORS).forEach(color => {
      expect(color).toMatch(hexPattern);
    });
  });
});

describe('getCalendarColor', () => {
  it('returns the correct color for each known calendar', () => {
    expect(getCalendarColor('cal-1')).toBe('#FF8C6B');
    expect(getCalendarColor('cal-2')).toBe('#4A90E2');
    expect(getCalendarColor('cal-3')).toBe('#9B59B6');
    expect(getCalendarColor('cal-4')).toBe('#2ECC71');
  });

  it('falls back to peachy color (#FF8C6B) for unknown calendar IDs', () => {
    expect(getCalendarColor('unknown-id')).toBe('#FF8C6B');
    expect(getCalendarColor('')).toBe('#FF8C6B');
    expect(getCalendarColor('cal-99')).toBe('#FF8C6B');
  });

  it('is case-sensitive — "CAL-1" does not match "cal-1"', () => {
    expect(getCalendarColor('CAL-1')).toBe('#FF8C6B');
  });
});
