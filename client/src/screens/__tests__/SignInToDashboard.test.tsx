import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import App from '../../../App';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';

// Correctly cast the mocks
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock;
const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

describe('Sign In to Dashboard Flow', () => {
  // Define the type explicitly using Firebase's NextOrObserver type (or a simple function)
  let authStateCallback: ((user: User | null) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the callback holder
    authStateCallback = undefined;

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      authStateCallback = callback;
      // Emit initial logged-out state
      callback(null);
      // Return a mock unsubscribe function
      return jest.fn();
    });
  });

  it('navigates to Dashboard after successful sign in', async () => {
    const { getByText, getAllByTestId } = render(<App />);

    expect(getByText('Welcome Back')).toBeTruthy();

    // Mock the successful login API call
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    const inputs = getAllByTestId('text-input-outlined');
    fireEvent.changeText(inputs[0], 'test@example.com');
    fireEvent.changeText(inputs[1], 'password123');

    // Press Sign In
    fireEvent.press(getByText('Sign In'));

    // Wait for the Sign In promise to resolve AND the state to update
    await act(async () => {
      if (typeof authStateCallback === 'function') {
        authStateCallback(mockUser);
      } else {
        throw new Error('authStateCallback was never initialized by onAuthStateChanged');
      }
    });

    // Verification
    await waitFor(() => {
      expect(getByText('Your Habits Today')).toBeTruthy();
    }, { timeout: 3000 });
  });
});