import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders, renderWithTheme } from '../test-utils';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

describe('ThemedView', () => {
  it('renders children', () => {
    renderWithProviders(
      <ThemedView>
        <ThemedText>Inside view</ThemedText>
      </ThemedView>
    );
    expect(screen.getByText('Inside view')).toBeTruthy();
  });

  it('passes through testID', () => {
    renderWithProviders(<ThemedView testID="my-view" />);
    expect(screen.getByTestId('my-view')).toBeTruthy();
  });

  it('renders multiple children', () => {
    renderWithProviders(
      <ThemedView>
        <ThemedText>First</ThemedText>
        <ThemedText>Second</ThemedText>
      </ThemedView>
    );
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });
});

describe('ThemedView theme color compliance', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies light background color by default', () => {
    renderWithProviders(<ThemedView testID="v" />);
    expect(screen.getByTestId('v')).toHaveStyle({ backgroundColor: Colors.light.background });
  });

  it('applies dark background color in dark mode', () => {
    renderWithTheme(<ThemedView testID="v" />, 'dark');
    expect(screen.getByTestId('v')).toHaveStyle({ backgroundColor: Colors.dark.background });
  });

  it('uses lightColor prop override', () => {
    renderWithProviders(<ThemedView testID="v" lightColor="#F0F0F0" />);
    expect(screen.getByTestId('v')).toHaveStyle({ backgroundColor: '#F0F0F0' });
  });

  it('uses darkColor prop override in dark mode', () => {
    renderWithTheme(<ThemedView testID="v" darkColor="#202020" />, 'dark');
    expect(screen.getByTestId('v')).toHaveStyle({ backgroundColor: '#202020' });
  });
});
