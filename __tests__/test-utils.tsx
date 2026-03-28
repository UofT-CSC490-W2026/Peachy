import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/theme-context';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

function renderWithTheme(
  ui: React.ReactElement,
  theme: 'light' | 'dark',
  options?: RenderOptions
) {
  jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue(theme);
  return render(ui, { wrapper: AllProviders, ...options });
}

export { renderWithProviders, renderWithTheme };
export * from '@testing-library/react-native';
