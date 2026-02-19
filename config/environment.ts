import Constants from 'expo-constants';

interface Environment {
  appEnv: 'development' | 'production';
  awsRegion: string;
  enableDebugLogging: boolean;
  // Add backend environment variables here when AWS infrastructure is ready
  // apiUrl?: string;
  // cognitoUserPoolId?: string;
  // cognitoClientId?: string;
}

const extra = Constants.expoConfig?.extra || {};

const env: Environment = {
  appEnv: extra.appEnv || 'development',
  awsRegion: 'ca-central-1', // Hardcoded - all resources in ca-central-1
  enableDebugLogging: extra.enableDebugLogging ?? false,
};

/**
 * Helper to log only in development.
 * Usage: devLog('User created event:', event.id)
 *
 * S15: Do NOT pass user objects, tokens, credentials, email addresses, or any
 * other PII to devLog — build logs may be captured and shared unintentionally.
 */
export const devLog = (...args: any[]) => {
  if (env.enableDebugLogging) {
    console.log('[DEV]', ...args);
  }
};

export default env;
