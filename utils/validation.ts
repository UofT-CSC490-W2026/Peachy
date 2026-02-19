export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  // S11: Enforce RFC 5321 max length and reject consecutive dots (invalid per spec)
  if (email.length > 254) return 'Email address is too long';
  if (/\.{2,}/.test(email)) return 'Please enter a valid email address';
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol (e.g. !@#$)';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer';
  return null;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

export function validateResetCode(code: string): string | null {
  if (!code.trim()) return 'Code is required';
  if (!/^\d{6}$/.test(code.trim())) return 'Enter the 6-digit code from your email';
  return null;
}

export function validateLoginForm(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const emailError = validateEmail(email);
  if (emailError) errors.push({ field: 'email', message: emailError });
  if (!password) errors.push({ field: 'password', message: 'Password is required' });
  return errors;
}

export function validateSignupForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const matchError = validatePasswordMatch(password, confirmPassword);
  if (nameError) errors.push({ field: 'name', message: nameError });
  if (emailError) errors.push({ field: 'email', message: emailError });
  if (passwordError) errors.push({ field: 'password', message: passwordError });
  if (matchError) errors.push({ field: 'confirmPassword', message: matchError });
  return errors;
}
