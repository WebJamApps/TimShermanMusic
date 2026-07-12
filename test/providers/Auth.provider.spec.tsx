/**
 * @file Auth.provider.spec.tsx
 * @description Unit tests for AuthProvider and its supporting utility functions.
 */

import React, { useContext } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AuthContext,
  AuthProvider,
  setUserAuth,
  expiredAuthReset,
  defaultAuth,
} from '../../src/providers/Auth.provider';

describe('Auth.provider authentication context', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('setUserAuth', () => {
    it('sets state with fetched user details on success', async () => {
      const mockUserObj = { email: 'tim@test.com', userType: 'artist-admin' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserObj,
      });

      const setAuthType = vi.fn();
      await setUserAuth('token-123', 'user-123', setAuthType, 'setAuth');

      expect(setAuthType).toHaveBeenCalledWith({
        token: 'token-123',
        error: '',
        isAuthenticated: true,
        user: mockUserObj,
      });
    });

    it('sets auth string correctly with setAuthString type', async () => {
      const mockUserObj = { email: 'tim@test.com', userType: 'artist-admin' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserObj,
      });

      const setAuthType = vi.fn();
      await setUserAuth('token-123', 'user-123', setAuthType, 'setAuthString');

      expect(setAuthType).toHaveBeenCalledWith(
        JSON.stringify({
          token: 'token-123',
          error: '',
          isAuthenticated: true,
          user: mockUserObj,
        })
      );
    });

    it('handles fetch failure gracefully by setting defaultAuth', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const setAuthType = vi.fn();
      await setUserAuth('token-123', 'user-123', setAuthType, 'setAuth');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(setAuthType).toHaveBeenCalledWith(defaultAuth);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('expiredAuthReset', () => {
    it('returns null if token is not expired', () => {
      const token = 'header.eyJleHAiOjE5MDAwMDAwMDB9.signature';
      const authString = JSON.stringify({ token });
      const result = expiredAuthReset(authString);
      expect(result).toBeNull();
    });

    it('returns default auth string if token is expired', () => {
      const token = 'header.eyJleHAiOjEwMDAwMDAwMDB9.signature';
      const authString = JSON.stringify({ token });
      const result = expiredAuthReset(authString);
      expect(result).toBe(JSON.stringify(defaultAuth));
    });

    it('returns null on invalid JSON parse exception', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = expiredAuthReset('invalid-json');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('provides defaultAuth state initially', () => {
      const Consumer = () => {
        const { auth } = useContext(AuthContext);
        return <div data-testid="auth-val">{JSON.stringify(auth)}</div>;
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-val').textContent).toBe(JSON.stringify(defaultAuth));
    });

    it('triggers google redirection url on loginWithGoogle', () => {
      const oldLocation = window.location;
      delete (window as any).location;
      window.location = { ...oldLocation, href: '' } as any;

      const Consumer = () => {
        const { loginWithGoogle } = useContext(AuthContext);
        return <button onClick={loginWithGoogle}>Login</button>;
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Login'));
      expect(window.location.href).toContain('accounts.google.com');

      (window as any).location = oldLocation;
    });

    // Regression guard for the double-click login bug (issue #34): the Google
    // redirect reloads the SPA, resetting AdminPanel's isOpen state. This flag
    // is how AdminPanel knows to reopen itself once auth comes back.
    it('persists tsm_open_admin intent flag before the OAuth redirect', () => {
      const oldLocation = window.location;
      delete (window as any).location;
      window.location = { ...oldLocation, href: '' } as any;

      const Consumer = () => {
        const { loginWithGoogle } = useContext(AuthContext);
        return <button onClick={loginWithGoogle}>Login</button>;
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      expect(localStorage.getItem('tsm_open_admin')).toBeNull();
      fireEvent.click(screen.getByText('Login'));
      expect(localStorage.getItem('tsm_open_admin')).toBe('1');

      (window as any).location = oldLocation;
    });

    it('resets auth values on logout call', () => {
      const Consumer = () => {
        const { auth, setAuth, logout } = useContext(AuthContext);
        return (
          <div>
            <div data-testid="auth-val">{JSON.stringify(auth)}</div>
            <button onClick={() => setAuth({ ...defaultAuth, isAuthenticated: true })}>Set</button>
            <button onClick={logout}>Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByText('Set'));
      expect(screen.getByTestId('auth-val').textContent).toContain('"isAuthenticated":true');

      fireEvent.click(screen.getByText('Logout'));
      expect(screen.getByTestId('auth-val').textContent).toBe(JSON.stringify(defaultAuth));
    });

    it('loads session on mount if valid token is found in storage', async () => {
      const token = 'header.eyJleHAiOjE5MDAwMDAwMDAsInN1YiI6InRlc3QtdXNlci1pZCJ9.signature';
      const storedAuth = {
        token,
        error: '',
        isAuthenticated: true,
        user: { email: 'preset@test.com', userType: 'artist-admin' },
      };
      localStorage.setItem('auth', JSON.stringify(storedAuth));

      const mockUserProfile = { email: 'refreshed@test.com', userType: 'artist-admin' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserProfile,
      });

      const Consumer = () => {
        const { auth } = useContext(AuthContext);
        return <div data-testid="auth-val">{JSON.stringify(auth)}</div>;
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      const authVal = await screen.findByText(/refreshed@test.com/);
      expect(authVal).toBeInTheDocument();
    });

    it('exchanges OAuth code from URL on mount', async () => {
      const oldLocation = window.location;
      delete (window as any).location;
      window.location = {
        ...oldLocation,
        search: '?code=oauth-test-code',
        origin: 'http://localhost:3000',
        pathname: '/',
        hash: '',
      } as any;

      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = vi.fn();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'header.eyJleHAiOjE5MDAwMDAwMDAsInN1YiI6InRlc3QtdXNlci1pZCJ9.signature' }),
      });
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'oauth-user@test.com', userType: 'artist-admin' }),
      });

      const Consumer = () => {
        const { auth } = useContext(AuthContext);
        return <div data-testid="auth-val">{JSON.stringify(auth)}</div>;
      };

      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      const authVal = await screen.findByText(/oauth-user@test.com/);
      expect(authVal).toBeInTheDocument();
      expect(window.history.replaceState).toHaveBeenCalled();

      window.history.replaceState = originalReplaceState;
      (window as any).location = oldLocation;
    });
  });
});
