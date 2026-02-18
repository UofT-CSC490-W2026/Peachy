export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  return null;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

export function validateLoginForm(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.push({ field: 'email', message: emailError });
  if (passwordError) errors.push({ field: 'password', message: passwordError });
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
