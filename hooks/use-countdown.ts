import { useState, useEffect, useRef } from 'react';

/**
 * Returns the number of whole seconds remaining until `lockedUntil`.
 * Counts down in 1-second ticks and returns 0 when expired or when
 * `lockedUntil` is null.
 *
 * The caller is responsible for managing the `lockedUntil` timestamp;
 * this hook only derives the display countdown from it.
 */
export function useCountdown(lockedUntil: number | null): number {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockedUntil === null) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setCountdown(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lockedUntil]);

  return countdown;
}
