import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@user_interests';

export function useInterests(initialInterests?: string[]) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialInterests ?? [])
  );
  const [loaded, setLoaded] = useState(!!initialInterests);
  const initializedRef = useRef(false);

  // Hydrate from initialInterests (backend source of truth) when available.
  // Falls back to AsyncStorage only if no backend data provided.
  useEffect(() => {
    if (initialInterests && !initializedRef.current) {
      initializedRef.current = true;
      setSelected(new Set(initialInterests));
      setLoaded(true);
      // Cache for offline fallback
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialInterests)).catch(() => {});
    } else if (!initialInterests && !initializedRef.current) {
      // Offline fallback: load from AsyncStorage with type validation
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.every((v: unknown) => typeof v === 'string')) {
              setSelected(new Set(parsed));
            }
          } catch {
            // Corrupt cache — ignore and start empty
          }
        }
        setLoaded(true);
        initializedRef.current = true;
      });
    }
  }, [initialInterests]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return { selected, toggle, loaded };
}
