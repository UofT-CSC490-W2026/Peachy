import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { resolvedTheme } = useTheme();

  if (hasHydrated) {
    return resolvedTheme;
  }

  return 'light' as const;
}
