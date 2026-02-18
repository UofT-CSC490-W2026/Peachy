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

// ─── Cognito Storage Adapter ──────────────────────────────────────────────────
// The Cognito SDK requires a synchronous storage interface. We satisfy this
// with an in-memory store that is mirrored to AsyncStorage (non-sensitive data)
// and SecureStore (tokens) asynchronously, giving us session persistence and
// encrypted token storage on native platforms.
const STORAGE_PREFIX = '@peachy:cognito:';
const SECURE_KEYS_INDEX = '@peachy:secure_keys_index';

// Key suffixes that Cognito stores as long-lived auth tokens
const TOKEN_SUFFIXES = ['idToken', 'accessToken', 'refreshToken', 'clockDrift'];

function isTokenKey(key: string): boolean {
  return TOKEN_SUFFIXES.some(suffix => key.endsWith('.' + suffix));
}

const memStore: Record<string, string> = {};
// Tracks which keys are persisted in SecureStore (vs AsyncStorage)
const secureKeySet = new Set<string>();

const cognitoStorage = {
  setItem: (key: string, value: string) => {
    memStore[key] = value;
    if (Platform.OS !== 'web' && isTokenKey(key)) {
      secureKeySet.add(key);
      SecureStore.setItemAsync(STORAGE_PREFIX + key, value).catch(() => {});
      // Keep an index of secure keys so hydrateStorage can find them
      AsyncStorage.setItem(SECURE_KEYS_INDEX, JSON.stringify([...secureKeySet])).catch(() => {});
    } else {
      AsyncStorage.setItem(STORAGE_PREFIX + key, value).catch(() => {});
    }
    return value;
  },
  getItem: (key: string) => memStore[key] ?? null,
  removeItem: (key: string) => {
    delete memStore[key];
    if (Platform.OS !== 'web' && secureKeySet.has(key)) {
      secureKeySet.delete(key);
      SecureStore.deleteItemAsync(STORAGE_PREFIX + key).catch(() => {});
      AsyncStorage.setItem(SECURE_KEYS_INDEX, JSON.stringify([...secureKeySet])).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_PREFIX + key).catch(() => {});
    }
  },
  clear: () => {
    const asyncKeys = Object.keys(memStore).filter(k => !secureKeySet.has(k));
    secureKeySet.forEach(k => SecureStore.deleteItemAsync(STORAGE_PREFIX + k).catch(() => {}));
    secureKeySet.clear();
    Object.keys(memStore).forEach(k => delete memStore[k]);
    AsyncStorage.multiRemove([SECURE_KEYS_INDEX, ...asyncKeys.map(k => STORAGE_PREFIX + k)]).catch(() => {});
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

    // On native, load tokens from SecureStore using the stored index
    if (Platform.OS !== 'web') {
      const indexStr = await AsyncStorage.getItem(SECURE_KEYS_INDEX);
      if (indexStr) {
        const storedKeys: string[] = JSON.parse(indexStr);
        await Promise.all(storedKeys.map(async (key) => {
          secureKeySet.add(key);
          const value = await SecureStore.getItemAsync(STORAGE_PREFIX + key);
          if (value !== null) memStore[key] = value;
        }));
      }
    }
  } catch {}
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
    // Use the token issue time as a stable createdAt approximation
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
    // signOut() clears the Cognito SDK's in-memory session without making
    // any network call, so it can't fail. We then clear our storage and
    // drop the user from state to redirect to auth screens immediately.
    getPool().getCurrentUser()?.signOut();
    cognitoStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        user,
        isLoading,
        isRestoring,
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
