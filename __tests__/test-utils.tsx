import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/theme-context';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { renderWithProviders };
export * from '@testing-library/react-native';
