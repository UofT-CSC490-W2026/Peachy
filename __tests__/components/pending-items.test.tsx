import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, act } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { PendingItems } from '@/components/pending-items';
import type { PendingItem } from '@/types';

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockCalendars = [
  { id: 'cal-1', name: 'Personal', color: '#FF8C6B', type: 'personal', ownerId: 'user-1', memberIds: ['user-1'], isVisible: true, createdAt: '', updatedAt: '' },
  { id: 'cal-2', name: 'Work', color: '#4A90E2', type: 'personal', ownerId: 'user-1', memberIds: ['user-1'], isVisible: true, createdAt: '', updatedAt: '' },
];

const mockEvents = [
  {
    id: 'evt-1', calendarId: 'cal-1', title: 'Team Lunch', startTime: '2026-04-01T19:00:00.000Z',
    endTime: '2026-04-01T20:00:00.000Z', isAllDay: false, timezone: 'UTC', status: 'confirmed',
    reminders: [], invitedUserIds: [], createdBy: 'user-2', createdAt: '', updatedAt: '',
  },
];

const mockGetUser = (id: string) => {
  if (id === 'user-2') return { id: 'user-2', name: 'Jordan Lee', username: 'jordanlee', email: '', createdAt: '', updatedAt: '' };
  return undefined;
};

jest.mock('@/contexts/calendar-context', () => ({
  useCalendar: () => ({
    calendars: mockCalendars,
    events: mockEvents,
    getUser: mockGetUser,
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const eventInviteItem: PendingItem = {
  id: 'pending-1',
  sk: 'PENDING#2026-03-01T00:00:00.000Z#pending-1',
  type: 'event_invite',
  status: 'pending',
  fromUserId: 'user-2',
  toUserId: 'user-1',
  eventId: 'evt-1',
  calendarId: 'cal-1',
  createdAt: '2026-03-01T00:00:00.000Z',
};

const eventUpdateItem: PendingItem = {
  id: 'pending-2',
  sk: 'PENDING#2026-03-02T00:00:00.000Z#pending-2',
  type: 'event_update',
  status: 'pending',
  fromUserId: 'user-2',
  toUserId: 'user-1',
  eventId: 'evt-1',
  calendarId: 'cal-1',
  createdAt: '2026-03-02T00:00:00.000Z',
};

const calendarInviteItem: PendingItem = {
  id: 'pending-3',
  sk: 'PENDING#2026-03-03T00:00:00.000Z#pending-3',
  type: 'calendar_invite',
  status: 'pending',
  fromUserId: 'user-2',
  toUserId: 'user-1',
  calendarId: 'cal-1',
  createdAt: '2026-03-03T00:00:00.000Z',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PendingItems', () => {
  const onAccept = jest.fn();
  const onDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  it('renders nothing when items list is empty', () => {
    renderWithProviders(<PendingItems items={[]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.queryByText('PENDING')).toBeNull();
  });

  // ── event_invite ────────────────────────────────────────────────────────────

  it('shows sender name and event title in event_invite description', () => {
    renderWithProviders(<PendingItems items={[eventInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText(/Jordan Lee invited you to/)).toBeTruthy();
    expect(screen.getByText(/Team Lunch/)).toBeTruthy();
  });

  it('shows Accept and Decline buttons for event_invite', () => {
    renderWithProviders(<PendingItems items={[eventInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
  });

  it('opens calendar picker modal when Accept tapped on event_invite', async () => {
    renderWithProviders(<PendingItems items={[eventInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    await act(async () => { fireEvent.press(screen.getByText('Accept')); });
    // Modal shows "Add to Calendar" heading and calendar options
    expect(screen.getByText('Add to Calendar')).toBeTruthy();
    expect(screen.getAllByText('Personal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
  });

  it('calls onAccept with calendarId when calendar is chosen from modal', async () => {
    renderWithProviders(<PendingItems items={[eventInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    await act(async () => { fireEvent.press(screen.getByText('Accept')); });
    await act(async () => { fireEvent.press(screen.getAllByText('Personal')[0]); });
    expect(onAccept).toHaveBeenCalledWith('pending-1', 'cal-1');
  });

  it('calls onDecline immediately when Decline tapped on event_invite', async () => {
    renderWithProviders(<PendingItems items={[eventInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    await act(async () => { fireEvent.press(screen.getByText('Decline')); });
    expect(onDecline).toHaveBeenCalledWith('pending-1');
  });

  // ── event_update ────────────────────────────────────────────────────────────

  it('shows Dismiss button (not Accept/Decline) for event_update', () => {
    renderWithProviders(<PendingItems items={[eventUpdateItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText('Dismiss')).toBeTruthy();
    expect(screen.queryByText('Accept')).toBeNull();
    expect(screen.queryByText('Decline')).toBeNull();
  });

  it('calls onDecline when Dismiss tapped on event_update', async () => {
    renderWithProviders(<PendingItems items={[eventUpdateItem]} onAccept={onAccept} onDecline={onDecline} />);
    await act(async () => { fireEvent.press(screen.getByText('Dismiss')); });
    expect(onDecline).toHaveBeenCalledWith('pending-2');
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('shows sender name, event title in event_update description', () => {
    renderWithProviders(<PendingItems items={[eventUpdateItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText(/Jordan Lee updated/)).toBeTruthy();
    expect(screen.getByText(/Team Lunch/)).toBeTruthy();
  });

  it('shows "Event Updated" title for event_update', () => {
    renderWithProviders(<PendingItems items={[eventUpdateItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getAllByText(/Event Updated/).length).toBeGreaterThan(0);
  });

  // ── other types ─────────────────────────────────────────────────────────────

  it('shows Accept and Decline for calendar_invite', () => {
    renderWithProviders(<PendingItems items={[calendarInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
  });

  it('calls onAccept immediately (no picker) for non-event-invite types', async () => {
    renderWithProviders(<PendingItems items={[calendarInviteItem]} onAccept={onAccept} onDecline={onDecline} />);
    await act(async () => { fireEvent.press(screen.getByText('Accept')); });
    expect(onAccept).toHaveBeenCalledWith('pending-3');
  });

  it('renders multiple items', () => {
    renderWithProviders(
      <PendingItems
        items={[eventInviteItem, eventUpdateItem]}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );
    expect(screen.getAllByText(/Event Invitation/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Event Updated/).length).toBeGreaterThan(0);
  });
});
