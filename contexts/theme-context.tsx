import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'medium' | 'large';

const FONT_SCALES: Record<TextSize, number> = {
  small: 0.88,
  medium: 1,
  large: 1.15,
};

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (t: ThemePreference) => void;
  resolvedTheme: 'light' | 'dark';
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
  fontScale: number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [textSize, setTextSizeState] = useState<TextSize>('medium');

  useEffect(() => {
    AsyncStorage.multiGet(['@theme_preference', '@text_size']).then((pairs) => {
      const [themePair, sizePair] = pairs;
      if (themePair[1]) setThemePreferenceState(themePair[1] as ThemePreference);
      if (sizePair[1]) setTextSizeState(sizePair[1] as TextSize);
    });
  }, []);

  const setThemePreference = (t: ThemePreference) => {
    setThemePreferenceState(t);
    AsyncStorage.setItem('@theme_preference', t);
  };

  const setTextSize = (s: TextSize) => {
    setTextSizeState(s);
    AsyncStorage.setItem('@text_size', s);
  };

  const resolvedTheme: 'light' | 'dark' =
    themePreference === 'system' ? systemScheme : themePreference;

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        setThemePreference,
        resolvedTheme,
        textSize,
        setTextSize,
        fontScale: FONT_SCALES[textSize],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
