import { getSlotIndex } from '@/utils/rl-helpers';

describe('getSlotIndex', () => {
  it('maps Monday (getDay=1) to day index 0', () => {
    const monday9am = new Date(2025, 2, 17, 9, 0); // March 17 2025 is a Monday
    expect(getSlotIndex(monday9am)).toBe(0 * 24 + 9);
  });

  it('maps Tuesday (getDay=2) to day index 1', () => {
    const tuesday9am = new Date(2025, 2, 18, 9, 0);
    expect(getSlotIndex(tuesday9am)).toBe(1 * 24 + 9);
  });

  it('maps Sunday (getDay=0) to day index 6', () => {
    const sunday9am = new Date(2025, 2, 23, 9, 0);
    expect(getSlotIndex(sunday9am)).toBe(6 * 24 + 9);
  });

  it('maps Saturday (getDay=6) to day index 5', () => {
    const saturday9am = new Date(2025, 2, 22, 9, 0);
    expect(getSlotIndex(saturday9am)).toBe(5 * 24 + 9);
  });

  it('returns 0 for Monday midnight', () => {
    const mondayMidnight = new Date(2025, 2, 17, 0, 0);
    expect(getSlotIndex(mondayMidnight)).toBe(0);
  });

  it('returns 23 for Monday 11pm', () => {
    const monday11pm = new Date(2025, 2, 17, 23, 0);
    expect(getSlotIndex(monday11pm)).toBe(23);
  });

  it('returns 167 for Sunday 11pm — the last slot in the week', () => {
    const sunday11pm = new Date(2025, 2, 23, 23, 0);
    expect(getSlotIndex(sunday11pm)).toBe(167);
  });

  it('always returns a value in [0, 167]', () => {
    const monday = new Date(2025, 2, 17, 0, 0);
    for (let h = 0; h < 168; h++) {
      const d = new Date(monday.getTime() + h * 60 * 60 * 1000);
      const idx = getSlotIndex(d);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(167);
    }
  });

  it('ignores minutes — same slot for :00 and :45 of the same hour', () => {
    const atHour = new Date(2025, 2, 17, 14, 0);
    const atHour45 = new Date(2025, 2, 17, 14, 45);
    expect(getSlotIndex(atHour)).toBe(getSlotIndex(atHour45));
  });
});
