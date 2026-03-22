import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AiInputBar } from '@/components/ai-input-bar';

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
  useAuth: () => ({ getIdToken: jest.fn().mockResolvedValue('mock-token'), logout: jest.fn() }),
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
