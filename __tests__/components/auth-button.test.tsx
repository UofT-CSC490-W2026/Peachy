import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { AuthButton } from '@/components/auth/auth-button';

describe('AuthButton', () => {
  it('renders title text', () => {
    renderWithProviders(<AuthButton title="Sign In" onPress={jest.fn()} />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithProviders(<AuthButton title="Sign In" onPress={onPress} />);
    fireEvent.press(screen.getByText('Sign In'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading is true', () => {
    renderWithProviders(<AuthButton title="Sign In" onPress={jest.fn()} loading />);
    expect(screen.queryByText('Sign In')).toBeNull();
  });

  it('renders Google prefix for google variant', () => {
    renderWithProviders(<AuthButton title="Continue with Google" onPress={jest.fn()} variant="google" />);
    expect(screen.getByText('G')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('does not show Google G for primary variant', () => {
    renderWithProviders(<AuthButton title="Sign Up" onPress={jest.fn()} variant="primary" />);
    expect(screen.queryByText('G')).toBeNull();
  });

  it('renders outline variant', () => {
    renderWithProviders(<AuthButton title="Cancel" onPress={jest.fn()} variant="outline" />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('shows loading indicator for outline variant', () => {
    renderWithProviders(<AuthButton title="Cancel" onPress={jest.fn()} variant="outline" loading />);
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('shows loading indicator for google variant', () => {
    renderWithProviders(<AuthButton title="Sign in" onPress={jest.fn()} variant="google" loading />);
    expect(screen.queryByText('Sign in')).toBeNull();
  });
});
