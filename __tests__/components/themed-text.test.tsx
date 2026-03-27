import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { ThemedText } from '@/components/themed-text';

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
