import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AiInputBar } from '@/components/ai-input-bar';

// Mock expo-av (native audio module unavailable in Jest)
jest.mock('expo-av', () => ({
  Audio: {
    Recording: { createAsync: jest.fn().mockResolvedValue({ recording: { stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined), getURI: jest.fn().mockReturnValue('file://recording.m4a') } }) },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn(),
  },
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'https://api.example.com' } } },
}));

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1' }, getIdToken: jest.fn().mockResolvedValue('mock-token'), logout: jest.fn() }),
}));

const mockCreateEvent = jest.fn().mockResolvedValue({});
jest.mock('@/contexts/calendar-context', () => ({
  useCalendar: () => ({ calendars: [{ id: 'cal-1', name: 'Personal' }], createEvent: mockCreateEvent }),
}));

jest.mock('@/utils/audio-transcribe', () => ({
  transcribeAudio: jest.fn().mockResolvedValue('transcribed text'),
}));

jest.mock('@/utils/api-client', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) { super(message); this.statusCode = statusCode; }
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
      expect(mockCreateEvent).toHaveBeenCalled();
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
    await act(async () => {});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('starts recording when mic button pressed', async () => {
    const { Audio } = require('expo-av');
    renderWithProviders(<AiInputBar />);
    const icons = screen.getAllByTestId('symbol-view');
    await act(async () => { fireEvent.press(icons[0]); });
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
  });
});
