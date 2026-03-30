import {
  validateEmail,
  validatePassword,
  validateName,
  validatePasswordMatch,
  validateResetCode,
  validateLoginForm,
  validateSignupForm,
} from '@/utils/validation';

describe('validateEmail', () => {
  it('returns null for valid emails', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('user+tag@sub.domain.org')).toBeNull();
    expect(validateEmail('a@b.io')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('returns error when exceeding 254 characters', () => {
    const long = 'a'.repeat(250) + '@b.co';
    expect(validateEmail(long)).toBe('Email address is too long');
  });

  it('returns error for consecutive dots', () => {
    expect(validateEmail('user..name@example.com')).toBe('Please enter a valid email address');
  });

  it('returns error for missing @ symbol', () => {
    expect(validateEmail('notanemail.com')).toBe('Please enter a valid email address');
  });

  it('returns error for missing TLD', () => {
    expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
  });
});

describe('validatePassword', () => {
  it('returns null for a valid strong password', () => {
    expect(validatePassword('Passw0rd!')).toBeNull();
  });

  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('returns error when shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters');
  });

  it('returns error when missing uppercase letter', () => {
    expect(validatePassword('passw0rd!')).toBe('Password must include an uppercase letter');
  });

  it('returns error when missing lowercase letter', () => {
    expect(validatePassword('PASSW0RD!')).toBe('Password must include a lowercase letter');
  });

  it('returns error when missing a digit', () => {
    expect(validatePassword('Password!')).toBe('Password must include a number');
  });

  it('returns error when missing a symbol', () => {
    expect(validatePassword('Password1')).toBe('Password must include a symbol (e.g. !@#$)');
  });
});

describe('validateName', () => {
  it('returns null for a valid name', () => {
    expect(validateName('Alex Morgan')).toBeNull();
    expect(validateName('A')).toBeNull();
  });

  it('returns error for empty name', () => {
    expect(validateName('')).toBe('Name is required');
    expect(validateName('   ')).toBe('Name is required');
  });

  it('returns error when name exceeds 100 characters', () => {
    const long = 'a'.repeat(101);
    expect(validateName(long)).toBe('Name must be 100 characters or fewer');
  });

  it('accepts exactly 100 characters', () => {
    const exact = 'a'.repeat(100);
    expect(validateName(exact)).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('Passw0rd!', 'Passw0rd!')).toBeNull();
  });

  it('returns error when confirm password is empty', () => {
    expect(validatePasswordMatch('Passw0rd!', '')).toBe('Please confirm your password');
  });

  it('returns error when passwords do not match', () => {
    expect(validatePasswordMatch('Passw0rd!', 'Different1!')).toBe('Passwords do not match');
  });
});

describe('validateResetCode', () => {
  it('returns null for a valid 6-digit code', () => {
    expect(validateResetCode('123456')).toBeNull();
    expect(validateResetCode('000000')).toBeNull();
  });

  it('returns error for empty code', () => {
    expect(validateResetCode('')).toBe('Code is required');
    expect(validateResetCode('   ')).toBe('Code is required');
  });

  it('returns error for non-digit characters', () => {
    expect(validateResetCode('12345a')).toBe('Enter the 6-digit code from your email');
  });

  it('returns error for wrong length', () => {
    expect(validateResetCode('12345')).toBe('Enter the 6-digit code from your email');
    expect(validateResetCode('1234567')).toBe('Enter the 6-digit code from your email');
  });
});

describe('validateLoginForm', () => {
  it('returns empty array for valid credentials', () => {
    expect(validateLoginForm('user@example.com', 'anypassword')).toEqual([]);
  });

  it('returns email error for invalid email', () => {
    const errors = validateLoginForm('bademail', 'anypassword');
    expect(errors.some(e => e.field === 'email')).toBe(true);
  });

  it('returns password error for empty password', () => {
    const errors = validateLoginForm('user@example.com', '');
    expect(errors.some(e => e.field === 'password')).toBe(true);
  });

  it('returns both errors when both fields invalid', () => {
    const errors = validateLoginForm('', '');
    expect(errors.length).toBe(2);
  });
});

describe('validateSignupForm', () => {
  const valid = {
    name: 'Alex Morgan',
    email: 'alex@example.com',
    password: 'Passw0rd!',
    confirm: 'Passw0rd!',
  };

  it('returns empty array for fully valid input', () => {
    expect(validateSignupForm(valid.name, valid.email, valid.password, valid.confirm)).toEqual([]);
  });

  it('returns name error when name is empty', () => {
    const errors = validateSignupForm('', valid.email, valid.password, valid.confirm);
    expect(errors.some(e => e.field === 'name')).toBe(true);
  });

  it('returns email error when email is invalid', () => {
    const errors = validateSignupForm(valid.name, 'bad', valid.password, valid.confirm);
    expect(errors.some(e => e.field === 'email')).toBe(true);
  });

  it('returns password error when password is weak', () => {
    const errors = validateSignupForm(valid.name, valid.email, 'weak', valid.confirm);
    expect(errors.some(e => e.field === 'password')).toBe(true);
  });

  it('returns confirmPassword error when passwords do not match', () => {
    const errors = validateSignupForm(valid.name, valid.email, valid.password, 'Different1!');
    expect(errors.some(e => e.field === 'confirmPassword')).toBe(true);
  });

  it('can return up to 4 errors simultaneously', () => {
    const errors = validateSignupForm('', '', 'a', 'b');
    expect(errors.length).toBe(4);
  });
});
