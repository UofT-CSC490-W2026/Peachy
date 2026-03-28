import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ThemeProvider, null, children);

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns light text color in light mode', () => {
    const { result } = renderHook(() => useThemeColor({}, 'text'), { wrapper });
    expect(result.current).toBe(Colors.light.text);
  });

  it('returns dark text color in dark mode', () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColor({}, 'text'), { wrapper });
    expect(result.current).toBe(Colors.dark.text);
  });

  it('returns light tint color in light mode', () => {
    const { result } = renderHook(() => useThemeColor({}, 'tint'), { wrapper });
    expect(result.current).toBe(Colors.light.tint);
  });

  it('light prop override takes precedence in light mode', () => {
    const { result } = renderHook(() => useThemeColor({ light: '#custom' }, 'text'), { wrapper });
    expect(result.current).toBe('#custom');
  });

  it('dark prop override takes precedence in dark mode', () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColor({ dark: '#custom' }, 'text'), { wrapper });
    expect(result.current).toBe('#custom');
  });

  it('dark prop override is ignored in light mode', () => {
    const { result } = renderHook(() => useThemeColor({ dark: '#custom' }, 'text'), { wrapper });
    expect(result.current).toBe(Colors.light.text);
  });
});
