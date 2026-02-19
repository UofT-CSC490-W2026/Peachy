/**
 * Returns the Thompson Sampling slot index for a given Date.
 * Slots are indexed as: day * 24 + hour
 * where day is 0=Mon, 1=Tue, ..., 6=Sun (matches API convention).
 */
export function getSlotIndex(date: Date): number {
  const day = (date.getDay() + 6) % 7;
  const hour = date.getHours();
  return day * 24 + hour;
}
