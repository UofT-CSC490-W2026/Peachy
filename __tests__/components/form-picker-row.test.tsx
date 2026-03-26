import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { FormPickerRow } from '@/components/form/form-picker-row';

describe('FormPickerRow', () => {
  it('renders the label', () => {
    renderWithProviders(
      <FormPickerRow label="Personal" value="personal" onPress={jest.fn()} />
    );
    expect(screen.getByText('Personal')).toBeTruthy();
  });

  it('renders the value', () => {
    renderWithProviders(
      <FormPickerRow label="Work Calendar" value="shared" onPress={jest.fn()} />
    );
    expect(screen.getByText('shared')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <FormPickerRow label="Select" value="none" onPress={onPress} />
    );
    fireEvent.press(screen.getByText('Select'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
