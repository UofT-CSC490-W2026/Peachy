import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AiInputBar } from '@/components/ai-input-bar';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'https://api.example.com' } } },
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ getIdToken: jest.fn().mockResolvedValue('mock-token'), logout: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe('AiInputBar', () => {
  it('renders the text input', () => {
    renderWithProviders(<AiInputBar />);
    expect(screen.getByPlaceholderText('Schedule with AI...')).toBeTruthy();
  });

  it('renders with initial value', () => {
    renderWithProviders(<AiInputBar initialValue="dinner tomorrow" />);
    expect(screen.getByDisplayValue('dinner tomorrow')).toBeTruthy();
  });

  it('does not show send button when input is empty', () => {
    renderWithProviders(<AiInputBar />);
    expect(screen.queryByTestId('send-button')).toBeNull();
  });

  it('updates input text when typing', () => {
    renderWithProviders(<AiInputBar />);
    const input = screen.getByPlaceholderText('Schedule with AI...');
    fireEvent.changeText(input, 'lunch with Jordan');
    expect(screen.getByDisplayValue('lunch with Jordan')).toBeTruthy();
  });

  it('calls fetch and navigates on successful send', async () => {
    const parsed = {
      parseId: 'p1',
      extractedData: {
        title: 'Lunch',
        startTime: '2026-03-28T12:00:00Z',
        endTime: '2026-03-28T13:00:00Z',
        isAllDay: false,
        invitedUserIds: [],
      },
      confidence: 0.9,
      ambiguities: [],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => parsed,
    });

    renderWithProviders(<AiInputBar initialValue="lunch tomorrow" />);
    const input = screen.getByPlaceholderText('Schedule with AI...');
    fireEvent(input, 'submitEditing');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/event-create' })
      );
    });
  });

  it('shows alert on non-ok fetch response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar initialValue="dinner tonight" />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', expect.any(String));
    });
  });

  it('shows alert on 401 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar initialValue="meeting friday" />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it('does not call fetch when input is empty', async () => {
    renderWithProviders(<AiInputBar />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');
    // Give async handleSend a chance to run
    await act(async () => {});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows voice input alert when mic button pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderWithProviders(<AiInputBar />);
    // Mic icon is the first symbol-view in the component
    const icons = screen.getAllByTestId('symbol-view');
    await act(async () => { fireEvent.press(icons[0]); });
    expect(alertSpy).toHaveBeenCalledWith('Voice Input', expect.any(String), expect.any(Array));
  });
});
