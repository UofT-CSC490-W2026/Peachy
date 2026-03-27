import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AiInputBar } from '@/components/ai-input-bar';

// Mock expo-av (native audio module unavailable in Jest)
jest.mock('expo-av', () => ({
  Audio: {
    Recording: jest.fn(),
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'https://api.example.com' } } },
}));

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1' }, getIdToken: jest.fn().mockResolvedValue('mock-token'), logout: jest.fn() }),
}));

// Mock calendar context
jest.mock('@/contexts/calendar-context', () => ({
  useCalendar: () => ({ calendars: [], createEvent: jest.fn() }),
}));

// Mock audio transcribe
jest.mock('@/utils/audio-transcribe', () => ({
  transcribeAudio: jest.fn(),
}));

// Mock api-client error classes
jest.mock('@/utils/api-client', () => ({
  ApiError: class ApiError extends Error {},
  AuthError: class AuthError extends Error {},
}));

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
});
