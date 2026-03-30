import { renderHook, act } from '@testing-library/react-native';
import { useCountdown } from '@/hooks/use-countdown';

jest.useFakeTimers();

describe('useCountdown', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns 0 when lockedUntil is null', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBe(0);
  });

  it('returns positive countdown for future timestamp', () => {
    const future = Date.now() + 5000;
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current).toBeGreaterThan(0);
  });

  it('returns 0 for past timestamp', () => {
    const past = Date.now() - 1000;
    const { result } = renderHook(() => useCountdown(past));
    expect(result.current).toBe(0);
  });

  it('counts down over time', () => {
    const future = Date.now() + 5000;
    const { result } = renderHook(() => useCountdown(future));
    const initial = result.current;

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current).toBeLessThan(initial);
  });

  it('reaches 0 when time expires', () => {
    const future = Date.now() + 3000;
    const { result } = renderHook(() => useCountdown(future));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(0);
  });

  it('resets to 0 when lockedUntil changes to null', () => {
    const future = Date.now() + 5000;
    const { result, rerender } = renderHook(
      ({ locked }: { locked: number | null }) => useCountdown(locked),
      { initialProps: { locked: future } }
    );
    expect(result.current).toBeGreaterThan(0);

    rerender({ locked: null });
    expect(result.current).toBe(0);
  });
});
