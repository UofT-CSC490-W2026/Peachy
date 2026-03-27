import { AUTH_CONSTANTS } from '@/constants/auth';

describe('AUTH_CONSTANTS', () => {
  it('has LOGIN_LOCK_DURATIONS for attempts 3, 4, 5', () => {
    expect(AUTH_CONSTANTS.LOGIN_LOCK_DURATIONS[3]).toBe(30);
    expect(AUTH_CONSTANTS.LOGIN_LOCK_DURATIONS[4]).toBe(60);
    expect(AUTH_CONSTANTS.LOGIN_LOCK_DURATIONS[5]).toBe(120);
  });

  it('has LOGIN_MAX_LOCK_SECONDS of 120', () => {
    expect(AUTH_CONSTANTS.LOGIN_MAX_LOCK_SECONDS).toBe(120);
  });

  it('has VERIFY_RESEND_COOLDOWN_SECONDS of 60', () => {
    expect(AUTH_CONSTANTS.VERIFY_RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it('has FORGOT_PASSWORD_SEND_COOLDOWN_SECONDS of 60', () => {
    expect(AUTH_CONSTANTS.FORGOT_PASSWORD_SEND_COOLDOWN_SECONDS).toBe(60);
  });
});
