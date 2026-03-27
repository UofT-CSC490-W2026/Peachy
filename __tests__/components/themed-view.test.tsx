import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

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
