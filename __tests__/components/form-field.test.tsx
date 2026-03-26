import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';

describe('FormField', () => {
  it('renders the label', () => {
    renderWithProviders(
      <FormField label="Email"><ThemedText>input</ThemedText></FormField>
    );
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('renders children', () => {
    renderWithProviders(
      <FormField label="Name"><ThemedText>child content</ThemedText></FormField>
    );
    expect(screen.getByText('child content')).toBeTruthy();
  });

  it('appends * when required', () => {
    renderWithProviders(
      <FormField label="Password" required><ThemedText>input</ThemedText></FormField>
    );
    expect(screen.getByText('Password *')).toBeTruthy();
  });

  it('does not append * when not required', () => {
    renderWithProviders(
      <FormField label="Notes"><ThemedText>input</ThemedText></FormField>
    );
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.queryByText('Notes *')).toBeNull();
  });
});
