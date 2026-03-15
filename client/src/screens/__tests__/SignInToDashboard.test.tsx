import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import App from '../../../App';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const mockSignInWithEmailAndPassword = jest.mocked(signInWithEmailAndPassword);
const mockOnAuthStateChanged = jest.mocked(onAuthStateChanged);
// 1. Better Mocking for React Native
//jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');


jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

describe('Sign In to Dashboard Flow', () => {
  let authStateCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      callback(null); // Initial state: logged out
      return jest.fn(); // unsubscribe
    });
  });

  it('navigates to Dashboard after successful sign in', async () => {
    // FIX: Destructure getAllByTestID
    const { getByText, queryByText, getAllByTestId } = render(<App />);

    expect(getByText('Welcome Back')).toBeTruthy();

    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123', email: 'test@example.com' },
    });

    // Use the destructured method
    const inputs = getAllByTestId('text-input-outlined');
    fireEvent.changeText(inputs[0], 'test@example.com');
    fireEvent.changeText(inputs[1], 'password123');

    fireEvent.press(getByText('Sign In'));

    // Trigger the auth change
    await act(async () => {
      if (authStateCallback) {
        authStateCallback({ uid: '123', email: 'test@example.com' });
      }
    });

    // Increase timeout if using complex navigation
    await waitFor(() => {
      expect(getByText('Your Habits Today')).toBeTruthy();
    }, { timeout: 3000 });
  });
});
