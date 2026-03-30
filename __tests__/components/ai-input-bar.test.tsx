import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AiInputBar } from '@/components/ai-input-bar';

const mockPush = jest.fn();
const mockCreateEvent = jest.fn().mockResolvedValue({});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'https://api.example.com' } } },
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    logout: jest.fn(),
  }),
}));

jest.mock('@/contexts/calendar-context', () => ({
  useCalendar: () => ({
    calendars: [{ id: 'cal-1', name: 'Personal' }],
    createEvent: mockCreateEvent,
  }),
}));

jest.mock('@/utils/audio-transcribe', () => ({
  transcribeAudio: jest.fn().mockResolvedValue('lunch with Jordan tomorrow'),
}));

jest.mock('@/utils/api-client', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  AuthError: class AuthError extends Error {},
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

  it('updates input text when typing', () => {
    renderWithProviders(<AiInputBar />);
    fireEvent.changeText(screen.getByPlaceholderText('Schedule with AI...'), 'lunch with Jordan');
    expect(screen.getByDisplayValue('lunch with Jordan')).toBeTruthy();
  });

  it('does not call fetch when input is empty', async () => {
    renderWithProviders(<AiInputBar />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');
    await act(async () => {});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls fetch and creates event in the only calendar (no picker shown)', async () => {
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
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => parsed,
    });

    renderWithProviders(<AiInputBar initialValue="lunch tomorrow" />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');

    await waitFor(() => {
      // Single calendar → uses it directly, no Alert picker shown
      expect(mockCreateEvent).toHaveBeenCalledWith('cal-1', expect.objectContaining({ title: 'Lunch' }));
    });
  });

  it('sends RL feedback even when createEvent fails', async () => {
    mockCreateEvent.mockRejectedValueOnce(new Error('Network error'));
    const calls: string[] = [];
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: async () => ({
        parseId: 'p-rl',
        extractedData: {
          title: 'Meeting',
          startTime: '2026-03-28T15:00:00Z',
          endTime: '2026-03-28T16:00:00Z',
          isAllDay: false,
          invitedUserIds: [],
        },
        confidence: 0.9,
        ambiguities: [],
      })});
    });

    renderWithProviders(<AiInputBar initialValue="meeting tomorrow" />);
    fireEvent(screen.getByPlaceholderText('Schedule with AI...'), 'submitEditing');

    await waitFor(() => {
      // RL feedback URL should have been called even though createEvent failed
      expect(calls.some(url => url.includes('/rl/feedback'))).toBe(true);
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

  it('starts recording when mic button pressed', async () => {
    const { Audio } = require('expo-av');
    renderWithProviders(<AiInputBar />);
    const icons = screen.getAllByTestId('symbol-view');
    await act(async () => { fireEvent.press(icons[0]); });
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
  });

  it('shows permission alert when mic permission denied', async () => {
    const { Audio } = require('expo-av');
    Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar />);
    const icons = screen.getAllByTestId('symbol-view');
    await act(async () => { fireEvent.press(icons[0]); });

    expect(alertSpy).toHaveBeenCalledWith('Permission Required', expect.any(String));
  });

  it('shows error alert when recording fails to start', async () => {
    const { Audio } = require('expo-av');
    Audio.Recording.createAsync.mockRejectedValueOnce(new Error('Hardware unavailable'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar />);
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not start recording. Please try again.');
    });
  });

  it('shows no speech detected alert when transcript is empty', async () => {
    const { transcribeAudio } = require('@/utils/audio-transcribe');
    transcribeAudio.mockResolvedValueOnce('');
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar />);
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No Speech Detected', expect.any(String));
    });
  });

  it('stops recording and transcribes when mic pressed again', async () => {
    const { transcribeAudio } = require('@/utils/audio-transcribe');
    renderWithProviders(<AiInputBar />);

    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });

    await waitFor(() => {
      expect(transcribeAudio).toHaveBeenCalled();
    });
  });

  it('shows session expired alert when stopRecording gets AuthError', async () => {
    const { transcribeAudio } = require('@/utils/audio-transcribe');
    const { AuthError } = require('@/utils/api-client');
    transcribeAudio.mockRejectedValueOnce(new AuthError('Unauthorized'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar />);
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Session Expired', expect.any(String));
    });
  });

  it('shows transcription failed alert on generic error', async () => {
    const { transcribeAudio } = require('@/utils/audio-transcribe');
    transcribeAudio.mockRejectedValueOnce(new Error('Network failure'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    renderWithProviders(<AiInputBar />);
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });
    await act(async () => { fireEvent.press(screen.getAllByTestId('symbol-view')[0]); });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Transcription Failed', expect.any(String));
    });
  });

});
