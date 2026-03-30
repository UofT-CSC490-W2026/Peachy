import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders, renderWithTheme } from '../test-utils';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

describe('ThemedText', () => {
  it('renders text content', () => {
    renderWithProviders(<ThemedText>Hello Peachy</ThemedText>);
    expect(screen.getByText('Hello Peachy')).toBeTruthy();
  });

  it('renders with title type', () => {
    renderWithProviders(<ThemedText type="title">My Title</ThemedText>);
    expect(screen.getByText('My Title')).toBeTruthy();
  });

  it('renders with subtitle type', () => {
    renderWithProviders(<ThemedText type="subtitle">My Subtitle</ThemedText>);
    expect(screen.getByText('My Subtitle')).toBeTruthy();
  });

  it('renders with defaultSemiBold type', () => {
    renderWithProviders(<ThemedText type="defaultSemiBold">Bold Text</ThemedText>);
    expect(screen.getByText('Bold Text')).toBeTruthy();
  });

  it('renders with link type', () => {
    renderWithProviders(<ThemedText type="link">Click here</ThemedText>);
    expect(screen.getByText('Click here')).toBeTruthy();
  });

  it('passes through custom testID', () => {
    renderWithProviders(<ThemedText testID="my-text">Test</ThemedText>);
    expect(screen.getByTestId('my-text')).toBeTruthy();
  });

  it('renders with inline fontSize style', () => {
    renderWithProviders(<ThemedText style={{ fontSize: 20 }}>Sized</ThemedText>);
    expect(screen.getByText('Sized')).toBeTruthy();
  });

  it('renders with inline lineHeight style', () => {
    renderWithProviders(<ThemedText style={{ lineHeight: 28 }}>Lined</ThemedText>);
    expect(screen.getByText('Lined')).toBeTruthy();
  });

  it('renders with explicit light and dark colors', () => {
    renderWithProviders(
      <ThemedText lightColor="#000000" darkColor="#ffffff">Colored</ThemedText>
    );
    expect(screen.getByText('Colored')).toBeTruthy();
  });
});

describe('ThemedText theme color compliance', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies light text color by default', () => {
    renderWithProviders(<ThemedText testID="t">X</ThemedText>);
    expect(screen.getByTestId('t')).toHaveStyle({ color: Colors.light.text });
  });

  it('applies dark text color in dark mode', () => {
    renderWithTheme(<ThemedText testID="t">X</ThemedText>, 'dark');
    expect(screen.getByTestId('t')).toHaveStyle({ color: Colors.dark.text });
  });

  it('applies tint color for link type in light mode', () => {
    renderWithProviders(<ThemedText testID="t" type="link">Link</ThemedText>);
    expect(screen.getByTestId('t')).toHaveStyle({ color: Colors.light.tint });
  });

  it('applies tint color for link type in dark mode', () => {
    renderWithTheme(<ThemedText testID="t" type="link">Link</ThemedText>, 'dark');
    expect(screen.getByTestId('t')).toHaveStyle({ color: Colors.dark.tint });
  });

  it('uses lightColor prop override in light mode', () => {
    renderWithProviders(<ThemedText testID="t" lightColor="#AABBCC">X</ThemedText>);
    expect(screen.getByTestId('t')).toHaveStyle({ color: '#AABBCC' });
  });

  it('uses darkColor prop override in dark mode', () => {
    renderWithTheme(<ThemedText testID="t" darkColor="#112233">X</ThemedText>, 'dark');
    expect(screen.getByTestId('t')).toHaveStyle({ color: '#112233' });
  });
});
