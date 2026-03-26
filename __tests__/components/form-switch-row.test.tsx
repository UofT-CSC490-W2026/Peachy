import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { FormSwitchRow } from '@/components/form/form-switch-row';

describe('FormSwitchRow', () => {
  it('renders the label', () => {
    renderWithProviders(
      <FormSwitchRow label="All day event" value={false} onValueChange={jest.fn()} />
    );
    expect(screen.getByText('All day event')).toBeTruthy();
  });

  it('renders switch in off state', () => {
    renderWithProviders(
      <FormSwitchRow label="Toggle" value={false} onValueChange={jest.fn()} />
    );
    const sw = screen.getByRole('switch');
    expect(sw.props.value).toBe(false);
  });

  it('renders switch in on state', () => {
    renderWithProviders(
      <FormSwitchRow label="Toggle" value={true} onValueChange={jest.fn()} />
    );
    const sw = screen.getByRole('switch');
    expect(sw.props.value).toBe(true);
  });

  it('calls onValueChange when toggled', () => {
    const onChange = jest.fn();
    renderWithProviders(
      <FormSwitchRow label="Toggle" value={false} onValueChange={onChange} />
    );
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
