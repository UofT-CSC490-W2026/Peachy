import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { FormTextInput } from '@/components/form/form-text-input';

describe('FormTextInput', () => {
  it('renders a text input with placeholder', () => {
    renderWithProviders(<FormTextInput placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('shows error message when error prop provided', () => {
    renderWithProviders(<FormTextInput error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('does not show error when error is null', () => {
    renderWithProviders(<FormTextInput error={null} placeholder="input" />);
    expect(screen.queryByText('This field is required')).toBeNull();
  });

  it('shows Show/Hide toggle when showToggle is true', () => {
    renderWithProviders(<FormTextInput showToggle placeholder="Password" />);
    expect(screen.getByText('Show')).toBeTruthy();
  });

  it('toggles password visibility when Show/Hide pressed', () => {
    renderWithProviders(<FormTextInput showToggle placeholder="Password" />);
    const toggle = screen.getByText('Show');
    fireEvent.press(toggle);
    expect(screen.getByText('Hide')).toBeTruthy();
  });

  it('does not show toggle when showToggle is false', () => {
    renderWithProviders(<FormTextInput placeholder="input" />);
    expect(screen.queryByText('Show')).toBeNull();
  });

  it('calls onChangeText when text changes', () => {
    const onChange = jest.fn();
    renderWithProviders(<FormTextInput placeholder="input" onChangeText={onChange} />);
    fireEvent.changeText(screen.getByPlaceholderText('input'), 'hello');
    expect(onChange).toHaveBeenCalledWith('hello');
  });
});
