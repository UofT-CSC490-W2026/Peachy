import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { EventCard } from '@/components/calendar/event-card';
import type { CalendarEvent } from '@/types';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockEvent: CalendarEvent = {
  id: 'evt-1',
  calendarId: 'cal-1',
  title: 'Team Standup',
  startTime: new Date(2026, 2, 23, 9, 0).toISOString(),
  endTime: new Date(2026, 2, 23, 9, 30).toISOString(),
  isAllDay: false,
  timezone: 'UTC',
  status: 'confirmed',
  reminders: [],
  invitedUserIds: [],
  createdBy: 'user-1',
  createdAt: new Date(2026, 2, 23).toISOString(),
  updatedAt: new Date(2026, 2, 23).toISOString(),
};

describe('EventCard', () => {
  it('renders event title', () => {
    renderWithProviders(<EventCard event={mockEvent} calendarColor="#FF8C6B" />);
    expect(screen.getByText('Team Standup')).toBeTruthy();
  });

  it('renders time range', () => {
    renderWithProviders(<EventCard event={mockEvent} calendarColor="#FF8C6B" />);
    expect(screen.getByText(/9:00/)).toBeTruthy();
  });

  it('renders location when provided', () => {
    const eventWithLocation = { ...mockEvent, location: 'Room 101' };
    renderWithProviders(<EventCard event={eventWithLocation} calendarColor="#FF8C6B" />);
    expect(screen.getByText('Room 101')).toBeTruthy();
  });

  it('does not render location when not provided', () => {
    renderWithProviders(<EventCard event={mockEvent} calendarColor="#FF8C6B" />);
    expect(screen.queryByText('Room 101')).toBeNull();
  });

  it('calls onPress when provided and card pressed', () => {
    const onPress = jest.fn();
    renderWithProviders(<EventCard event={mockEvent} calendarColor="#FF8C6B" onPress={onPress} />);
    fireEvent.press(screen.getByText('Team Standup'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows All Day for all-day events', () => {
    const allDay = { ...mockEvent, isAllDay: true };
    renderWithProviders(<EventCard event={allDay} calendarColor="#FF8C6B" />);
    expect(screen.getByText('All Day')).toBeTruthy();
  });
});
