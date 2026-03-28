import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { CalendarHeader } from '@/components/calendar/calendar-header';

describe('CalendarHeader', () => {
  const date = new Date(2025, 2, 1); // March 2025
  const onPrevMonth = jest.fn();
  const onNextMonth = jest.fn();
  const onToday = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders month and year', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={date}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    expect(screen.getByText('March 2025')).toBeTruthy();
  });

  it('renders Today button', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={date}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('calls onPrevMonth when left chevron pressed', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={date}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    const icons = screen.getAllByTestId('symbol-view');
    fireEvent.press(icons[0]);
    expect(onPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onToday when Today button pressed', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={date}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    fireEvent.press(screen.getByText('Today'));
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when right chevron pressed', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={date}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    const icons = screen.getAllByTestId('symbol-view');
    fireEvent.press(icons[1]);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it('renders correct month for December', () => {
    renderWithProviders(
      <CalendarHeader
        currentDate={new Date(2025, 11, 1)}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
    );
    expect(screen.getByText('December 2025')).toBeTruthy();
  });
});
