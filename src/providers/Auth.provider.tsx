/**
 * @file Auth.provider.tsx
 * @description Authentication provider and context for Google OAuth login and admin status checking.
 */

import React, {
  createContext, useEffect,
} from 'react';
import { usePersistedState } from '../lib/usePersistedState';
import { isTokenExpired, getTokenSub } from '../lib/tokenExpiry';

export interface Iauth {
  isAuthenticated: boolean;
  error: string;
  token: string;
  user: {
    userType: string;
    email: string;
    name?: string;
  };
}

export const defaultAuth: Iauth = {
  isAuthenticated: false,
  error: '',
  token: '',
  user: { userType: '', email: '' },
};

export const defaultSetAuth = (arg0: Iauth) => {
  console.error(arg0);
};

export const AuthContext = createContext({
  auth: defaultAuth,
  setAuth: defaultSetAuth,
  loginWithGoogle: () => {},
  logout: () => {},
});

declare const process: {
  env: {
    BackendUrl?: string;
    GoogleClientId?: string;
  };
};

const getBackendUrl = (): string =>
  process.env.BackendUrl || (import.meta.env.DEV ? 'http://localhost:7000' : '');

export const setUserAuth = async (
  token: string,
  userId: string | undefined,
  setAuthType: (arg0: string | Iauth) => void,
  type: 'setAuth' | 'setAuthString',
) => {
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/user/${userId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const body = await res.json();
    if (type === 'setAuthString') {
      setAuthType(JSON.stringify({
        token, error: '', isAuthenticated: true, user: body,
      }));
    } else {
      setAuthType({
        token, error: '', isAuthenticated: true, user: body,
      });
    }
  } catch (err) {
    console.error('setUserAuth failed:', err);
    if (type === 'setAuthString') {
      setAuthType(JSON.stringify(defaultAuth));
    } else {
      setAuthType(defaultAuth);
    }
  }
};

export function expiredAuthReset(authString: string): string | null {
  try {
    const { token } = JSON.parse(authString);
    if (token && isTokenExpired(token)) return JSON.stringify(defaultAuth);
  } catch (err) {
    console.error('expiredAuthReset check failed:', err);
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { Provider } = AuthContext;
  const [authString, setAuthString] = usePersistedState('auth', JSON.stringify(defaultAuth));

  // 1. Re-validate existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      if (typeof authString !== 'string') return;
      try {
        const authObj = JSON.parse(authString);
        const { token } = authObj;
        if (!token) return;
        const sub = getTokenSub(token);
        if (!sub) throw new Error('token has no subject');
        await setUserAuth(token, sub, setAuthString as (arg0: string | Iauth) => void, 'setAuthString');
      } catch (err) {
        console.error('Failed to load session:', err);
        setAuthString(JSON.stringify(defaultAuth));
      }
    };
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Parse Google OAuth code redirect on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // Clear URL params immediately for clean browser state
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);

    const exchangeCode = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/user/auth/google`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: process.env.GoogleClientId,
            redirectUri: window.location.origin,
            code,
          }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const { token } = await res.json();
        const sub = getTokenSub(token) ?? undefined;
        await setUserAuth(token, sub, setAuthString as (arg0: string | Iauth) => void, 'setAuthString');
      } catch (err) {
        console.error('Failed to exchange Google OAuth code:', err);
      }
    };
    exchangeCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Keep token expiration checker active
  useEffect(() => {
    const checkExpiry = () => {
      const reset = expiredAuthReset(authString);
      if (reset) setAuthString(reset);
    };
    checkExpiry();
    const id = window.setInterval(checkExpiry, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authString]);

  let auth = defaultAuth;
  try {
    auth = JSON.parse(authString);
  } catch {
    /* parse error */
  }

  const setAuth = (newAuth: Iauth) => {
    setAuthString(JSON.stringify(newAuth));
  };

  const loginWithGoogle = () => {
    const clientId = process.env.GoogleClientId || '';
    const redirectUri = window.location.origin;
    // eslint-disable-next-line sonarjs/pseudo-random
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth_state', state);
    // Full-page redirect below reloads the SPA on return, resetting AdminPanel's
    // isOpen state. Persist the intent to reopen the admin panel so AdminPanel
    // can restore it once auth comes back (see tsm_open_admin in AdminPanel.tsx).
    localStorage.setItem('tsm_open_admin', '1');

    const oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = oauthUrl;
  };

  const logout = () => {
    setAuthString(JSON.stringify(defaultAuth));
  };

  return (
    <Provider value={{
      auth, setAuth, loginWithGoogle, logout,
    }}>
      {children}
    </Provider>
  );
}
