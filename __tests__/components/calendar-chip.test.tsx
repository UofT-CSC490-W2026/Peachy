import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { CalendarChip } from '@/components/calendar/calendar-chip';

describe('CalendarChip', () => {
  it('renders the calendar name', () => {
    renderWithProviders(
      <CalendarChip name="Work" color="#4A90E2" isVisible={true} onToggle={jest.fn()} />
    );
    expect(screen.getByText(/Work/)).toBeTruthy();
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    renderWithProviders(
      <CalendarChip name="Work" color="#4A90E2" isVisible={true} onToggle={onToggle} />
    );
    fireEvent.press(screen.getByText(/Work/));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders in visible state', () => {
    renderWithProviders(
      <CalendarChip name="Personal" color="#FF8C6B" isVisible={true} onToggle={jest.fn()} />
    );
    expect(screen.getByText(/Personal/)).toBeTruthy();
  });

  it('renders in hidden state', () => {
    renderWithProviders(
      <CalendarChip name="Personal" color="#FF8C6B" isVisible={false} onToggle={jest.fn()} />
    );
    expect(screen.getByText(/Personal/)).toBeTruthy();
  });
});
