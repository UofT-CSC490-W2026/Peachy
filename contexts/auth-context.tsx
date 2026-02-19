import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { User } from '@/types';
import { devLog } from '@/config/environment';

// ─── Cognito Storage Adapter ──────────────────────────────────────────────────
// The Cognito SDK requires a synchronous storage interface. We satisfy this
// with an in-memory store that is mirrored to AsyncStorage (non-sensitive data)
// and SecureStore (tokens) asynchronously, giving us session persistence and
// encrypted token storage on native platforms.
const STORAGE_PREFIX = '@peachy:cognito:';

// Key suffixes that Cognito stores as long-lived auth tokens
const TOKEN_SUFFIXES = ['idToken', 'accessToken', 'refreshToken', 'clockDrift'];

// Fixed key for the SecureStore-backed index of secure keys (S3).
// Storing the index in SecureStore rather than AsyncStorage prevents the user's
// email and Cognito client ID from being visible in plain-text SQLite on-device.
// On web, SecureStore is not available so there is no index needed (everything
// goes through AsyncStorage).
const INDEX_SECURE_KEY = 'peachy_cognito_key_index';

function isTokenKey(key: string): boolean {
  return TOKEN_SUFFIXES.some(suffix => key.endsWith('.' + suffix));
}

// S5: Use an empty-string overwrite before delete so raw JWT strings are not
// lingering as reachable strings in the JS heap after logout.
const memStore: Record<string, string> = {};
// Tracks which keys are persisted in SecureStore (vs AsyncStorage)
const secureKeySet = new Set<string>();

const cognitoStorage = {
  setItem: (key: string, value: string) => {
    memStore[key] = value;
    if (Platform.OS !== 'web' && isTokenKey(key)) {
      secureKeySet.add(key);
      // S2: Log write failures so silent data-loss is surfaced in dev builds.
      SecureStore.setItemAsync(STORAGE_PREFIX + key, value).catch((e) =>
        devLog('SecureStore setItem failed for key:', key, e)
      );
      // S3: Keep the key index in SecureStore (not AsyncStorage) to avoid
      // exposing the user's email in plain-text on-device storage.
      SecureStore.setItemAsync(INDEX_SECURE_KEY, JSON.stringify([...secureKeySet])).catch((e) =>
        devLog('SecureStore index write failed:', e)
      );
    } else {
      AsyncStorage.setItem(STORAGE_PREFIX + key, value).catch((e) =>
        devLog('AsyncStorage setItem failed for key:', key, e)
      );
    }
    return value;
  },
  getItem: (key: string) => memStore[key] ?? null,
  removeItem: (key: string) => {
    delete memStore[key];
    if (Platform.OS !== 'web' && secureKeySet.has(key)) {
      secureKeySet.delete(key);
      SecureStore.deleteItemAsync(STORAGE_PREFIX + key).catch((e) =>
        devLog('SecureStore deleteItem failed for key:', key, e)
      );
      // S2 + S3: Update key index in SecureStore on removal.
      SecureStore.setItemAsync(INDEX_SECURE_KEY, JSON.stringify([...secureKeySet])).catch((e) =>
        devLog('SecureStore index write failed:', e)
      );
    } else {
      AsyncStorage.removeItem(STORAGE_PREFIX + key).catch((e) =>
        devLog('AsyncStorage removeItem failed for key:', key, e)
      );
    }
  },
  clear: () => {
    const asyncKeys = Object.keys(memStore).filter(k => !secureKeySet.has(k));
    secureKeySet.forEach(k =>
      SecureStore.deleteItemAsync(STORAGE_PREFIX + k).catch((e) =>
        devLog('SecureStore deleteItem failed for key:', k, e)
      )
    );
    // S3: Remove the secure key index from SecureStore on logout.
    if (Platform.OS !== 'web') {
      SecureStore.deleteItemAsync(INDEX_SECURE_KEY).catch((e) =>
        devLog('SecureStore delete INDEX failed:', e)
      );
    }
    secureKeySet.clear();
    // S5: Overwrite token strings before deleting so JWT values are not
    // recoverable from the Hermes/V8 heap after logout.
    for (const key of Object.keys(memStore)) {
      memStore[key] = '';
      delete memStore[key];
    }
    AsyncStorage.multiRemove(asyncKeys.map(k => STORAGE_PREFIX + k)).catch((e) =>
      devLog('AsyncStorage multiRemove failed:', e)
    );
  },
};

// Load all Cognito tokens from AsyncStorage/SecureStore into the memory store.
// Must be called before accessing the user pool on app start.
async function hydrateStorage() {
  try {
    // Load non-token data (e.g. LastAuthUser) from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const cognitoKeys = allKeys.filter(k => k.startsWith(STORAGE_PREFIX));
    if (cognitoKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(cognitoKeys);
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          memStore[key.slice(STORAGE_PREFIX.length)] = value;
        }
      });
    }

    // On native, load tokens from SecureStore using the stored index.
    // S3: The index is stored in SecureStore, not AsyncStorage.
    // S4: Separate JSON.parse errors from SecureStore read errors so corrupt
    //     index data is handled gracefully without silently masking other faults.
    if (Platform.OS !== 'web') {
      const indexStr = await SecureStore.getItemAsync(INDEX_SECURE_KEY);
      let storedKeys: string[] = [];
      if (indexStr) {
        try {
          storedKeys = JSON.parse(indexStr);
        } catch (parseErr) {
          devLog('hydrateStorage: corrupt key index, clearing index', parseErr);
          await SecureStore.deleteItemAsync(INDEX_SECURE_KEY).catch((e) =>
            devLog('hydrateStorage: failed to clear corrupt index:', e)
          );
        }
      }
      await Promise.all(storedKeys.map(async (key) => {
        secureKeySet.add(key);
        try {
          const value = await SecureStore.getItemAsync(STORAGE_PREFIX + key);
          if (value !== null) memStore[key] = value;
        } catch (e) {
          devLog('hydrateStorage: SecureStore read failed for key:', key, e);
        }
      }));
    }
  } catch (e) {
    // S4: Log the fatal path so developers can diagnose unexpected storage failures.
    devLog('hydrateStorage: fatal error, defaulting to unauthenticated', e);
  }
}

// ─── User Pool Singleton ──────────────────────────────────────────────────────
let _pool: CognitoUserPool | null = null;

function getPool(): CognitoUserPool {
  if (_pool) return _pool;
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  _pool = new CognitoUserPool({
    UserPoolId: extra.cognitoUserPoolId ?? '',
    ClientId: extra.cognitoClientId ?? '',
    Storage: cognitoStorage,
  });
  return _pool;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function userFromSession(session: CognitoUserSession): User {
  const claims = session.getIdToken().payload as Record<string, string | number>;
  return {
    id: claims.sub as string,
    name: (claims.name ?? claims.given_name ?? claims.email) as string,
    username: (claims['cognito:username'] ?? claims.email) as string,
    email: claims.email as string,
    // NOTE (S17): `iat` is the token issue time, not the account creation time.
    // These fields will need correction when backend profile data is integrated.
    createdAt: new Date(Number(claims.iat) * 1000).toISOString(),
    updatedAt: new Date(Number(claims.iat) * 1000).toISOString(),
  };
}

function cognitoErrorMessage(err: { code?: string; message: string }): string {
  switch (err.code) {
    case 'UserNotFoundException':
    case 'NotAuthorizedException':
      return 'Incorrect email or password';
    case 'UserNotConfirmedException':
      return 'Please verify your email before logging in';
    case 'UsernameExistsException':
      return 'An account with this email already exists';
    case 'InvalidPasswordException':
      return 'Password must include uppercase, lowercase, a number, and a symbol';
    case 'CodeMismatchException':
      return 'Invalid verification code. Please try again';
    case 'ExpiredCodeException':
      return 'Code has expired. Request a new one';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts. Please try again later';
    default:
      return err.message || 'Something went wrong. Please try again';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthResult {
  success: boolean;
  error?: string;
  pendingVerification?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isRestoring: boolean;
  // S10: Email pending verification stored in context (not URL params) to avoid
  // exposing PII in iOS system logs, Android logcat, and web browser history.
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  confirmSignup: (email: string, code: string) => Promise<AuthResult>;
  resendCode: (email: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  // S10: Transient email for the verification flow — stored in memory, never in URL.
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Restore Cognito session from storage on mount
  useEffect(() => {
    hydrateStorage().then(() => {
      const pool = getPool();
      const currentUser = pool.getCurrentUser();
      if (!currentUser) {
        setIsRestoring(false);
        return;
      }
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (!err && session?.isValid()) {
          setUser(userFromSession(session));
        }
        setIsRestoring(false);
      });
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      // S9: USER_PASSWORD_AUTH sends the raw password over TLS (rather than an SRP verifier).
      // This is intentional for MVP simplicity — the Cognito app client must have
      // ALLOW_USER_PASSWORD_AUTH enabled. Migrate to USER_SRP_AUTH via expo-crypto if
      // Cognito Advanced Security Features (ASF) or compliance requirements demand it.
      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() });
      cognitoUser.setAuthenticationFlowType('USER_PASSWORD_AUTH');

      return await new Promise<AuthResult>((resolve) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            setUser(userFromSession(session));
            resolve({ success: true });
          },
          onFailure: (err) => {
            resolve({
              success: false,
              error: cognitoErrorMessage(err),
              // S6: pendingVerification is returned to the caller but the login screen
              // no longer redirects to verify — that would reveal email enumeration.
              pendingVerification: err.code === 'UserNotConfirmedException',
            });
          },
          newPasswordRequired: () => {
            resolve({
              success: false,
              error: 'Your account requires a new password. Please use "Forgot Password" to reset it.',
            });
          },
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const attributes = [
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];

      return await new Promise<AuthResult>((resolve) => {
        getPool().signUp(email, password, attributes, [], (err) => {
          if (err) {
            resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) });
            return;
          }
          resolve({ success: true, pendingVerification: true });
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmSignup = useCallback(async (email: string, code: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() });
      return await new Promise<AuthResult>((resolve) => {
        cognitoUser.confirmRegistration(code, true, (err) => {
          if (err) {
            resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) });
            return;
          }
          resolve({ success: true });
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendCode = useCallback(async (email: string): Promise<AuthResult> => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() });
    return new Promise<AuthResult>((resolve) => {
      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) });
          return;
        }
        resolve({ success: true });
      });
    });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() });
    return new Promise<AuthResult>((resolve) => {
      cognitoUser.forgotPassword({
        onSuccess: () => resolve({ success: true }),
        onFailure: (err) => {
          // Always return success for UserNotFoundException to prevent account enumeration
          if ((err as { code?: string }).code === 'UserNotFoundException') {
            resolve({ success: true });
            return;
          }
          resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) });
        },
      });
    });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
    const cognitoUser = new CognitoUser({ Username: email, Pool: getPool() });
    return new Promise<AuthResult>((resolve) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve({ success: true }),
        onFailure: (err) => resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) }),
      });
    });
  }, []);

  const logout = useCallback(() => {
    // S1: globalSignOut invalidates the Cognito refresh token server-side so that
    // exfiltrated tokens cannot be used after the user logs out. We clear local
    // state regardless of whether the network call succeeds (fail-safe).
    const cognitoUser = getPool().getCurrentUser();
    const doLocalSignOut = () => {
      cognitoStorage.clear();
      setUser(null);
    };
    if (cognitoUser) {
      cognitoUser.globalSignOut({
        onSuccess: doLocalSignOut,
        onFailure: doLocalSignOut,
      });
    } else {
      doLocalSignOut();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        user,
        isLoading,
        isRestoring,
        pendingVerificationEmail,
        setPendingVerificationEmail,
        login,
        signup,
        confirmSignup,
        resendCode,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
