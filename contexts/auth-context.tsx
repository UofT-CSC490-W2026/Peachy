import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { User } from '@/types';

// ─── Cognito Storage Adapter ──────────────────────────────────────────────────
// The Cognito SDK requires a synchronous storage interface. We satisfy this
// with an in-memory store that is mirrored to AsyncStorage asynchronously,
// giving us session persistence across app restarts.
const STORAGE_PREFIX = '@peachy:cognito:';
const memStore: Record<string, string> = {};

const cognitoStorage = {
  setItem: (key: string, value: string) => {
    memStore[key] = value;
    AsyncStorage.setItem(STORAGE_PREFIX + key, value).catch(() => {});
    return value;
  },
  getItem: (key: string) => memStore[key] ?? null,
  removeItem: (key: string) => {
    delete memStore[key];
    AsyncStorage.removeItem(STORAGE_PREFIX + key).catch(() => {});
  },
  clear: () => {
    const keys = Object.keys(memStore);
    keys.forEach(k => delete memStore[k]);
    AsyncStorage.multiRemove(keys.map(k => STORAGE_PREFIX + k)).catch(() => {});
  },
};

// Load all Cognito tokens from AsyncStorage into the memory store.
// Must be called before accessing the user pool on app start.
async function hydrateStorage() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cognitoKeys = allKeys.filter(k => k.startsWith(STORAGE_PREFIX));
    if (cognitoKeys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(cognitoKeys);
    pairs.forEach(([key, value]) => {
      if (value !== null) {
        memStore[key.slice(STORAGE_PREFIX.length)] = value;
      }
    });
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
  const claims = session.getIdToken().payload as Record<string, string>;
  return {
    id: claims.sub,
    name: claims.name ?? claims.given_name ?? claims.email,
    username: claims['cognito:username'] ?? claims.email,
    email: claims.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function cognitoErrorMessage(err: { code?: string; message: string }): string {
  switch (err.code) {
    case 'UserNotFoundException':
      return 'No account found with that email';
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore Cognito session from AsyncStorage on mount
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
            resolve({ success: false, error: 'Password reset required. Please contact support.' });
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
        onFailure: (err) => resolve({ success: false, error: cognitoErrorMessage(err as { code?: string; message: string }) }),
      });
    });
  }, []);

  const logout = useCallback(() => {
    const currentUser = getPool().getCurrentUser();
    if (currentUser) currentUser.signOut();
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
