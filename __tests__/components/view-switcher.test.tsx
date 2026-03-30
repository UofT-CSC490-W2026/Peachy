import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { ViewSwitcher } from '@/components/calendar/view-switcher';

describe('ViewSwitcher', () => {
  it('renders all three view options', () => {
    renderWithProviders(<ViewSwitcher currentView="month" onViewChange={jest.fn()} />);
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('calls onViewChange with day when Day pressed', () => {
    const onChange = jest.fn();
    renderWithProviders(<ViewSwitcher currentView="month" onViewChange={onChange} />);
    fireEvent.press(screen.getByText('Day'));
    expect(onChange).toHaveBeenCalledWith('day');
  });

  it('calls onViewChange with week when Week pressed', () => {
    const onChange = jest.fn();
    renderWithProviders(<ViewSwitcher currentView="day" onViewChange={onChange} />);
    fireEvent.press(screen.getByText('Week'));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('calls onViewChange with month when Month pressed', () => {
    const onChange = jest.fn();
    renderWithProviders(<ViewSwitcher currentView="day" onViewChange={onChange} />);
    fireEvent.press(screen.getByText('Month'));
    expect(onChange).toHaveBeenCalledWith('month');
  });
});
