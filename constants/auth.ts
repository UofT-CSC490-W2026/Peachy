// Centralized auth constants — single source of truth for all auth screens.

export const AUTH_CONSTANTS = {
  // Login lockout durations by attempt number (seconds)
  LOGIN_LOCK_DURATIONS: { 3: 30, 4: 60, 5: 120 } as Record<number, number>,
  // Lock seconds applied for all attempts beyond the last defined key
  LOGIN_MAX_LOCK_SECONDS: 120,
  // Cooldown applied after sending a verification code resend (seconds)
  VERIFY_RESEND_COOLDOWN_SECONDS: 60,
  // Cooldown applied after sending a password-reset code (seconds)
  FORGOT_PASSWORD_SEND_COOLDOWN_SECONDS: 60,
} as const;
