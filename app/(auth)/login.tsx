import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { AuthButton } from '@/components/auth/auth-button';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateLoginForm } from '@/utils/validation';

// Lock durations by attempt count (seconds)
const LOCK_DURATIONS: Record<number, number> = { 3: 30, 4: 60, 5: 120 };

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const dangerColor = useThemeColor({}, 'danger');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockedUntil === null) return;

    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
        setLockedUntil(null);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setCountdown(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = async () => {
    if (isLocked) return;

    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(e => { errorMap[e.field] = e.message; });
      setErrors(errorMap);
      return;
    }
    setErrors({});
    setFormError(null);

    const result = await login(email, password);
    if (!result.success) {
      if (result.pendingVerification) {
        router.push({ pathname: '/(auth)/verify' as never, params: { email } });
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        const lockSeconds = LOCK_DURATIONS[newAttempts] ?? (newAttempts > 5 ? 120 : null);
        if (lockSeconds) {
          setLockedUntil(Date.now() + lockSeconds * 1000);
        }
        setFormError(result.error ?? 'Login failed. Please try again.');
      }
    } else {
      setLoginAttempts(0);
      setLockedUntil(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title">Welcome back</ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Sign in to your account
          </ThemedText>

          <FormField label="Email" required>
            <FormTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              error={errors.email}
            />
          </FormField>

          <FormField label="Password" required>
            <FormTextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="off"
              showToggle
              error={errors.password}
            />
          </FormField>

          <Pressable
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <ThemedText type="link">Forgot password?</ThemedText>
          </Pressable>

          <AuthButton
            title={isLocked ? `Try again in ${countdown}s` : 'Log In'}
            onPress={handleLogin}
            loading={isLoading && !isLocked}
          />

          {formError && (
            <ThemedText style={[styles.formError, { color: dangerColor }]}>
              {formError}
            </ThemedText>
          )}

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            <ThemedText style={[styles.dividerText, { color: textSecondary }]}>or</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
          </View>

          <AuthButton
            title="Continue with Google"
            variant="google"
            onPress={() => setFormError('Google sign-in coming soon.')}
          />

          <View style={styles.footer}>
            <ThemedText style={{ color: textSecondary }}>
              Don't have an account?{' '}
            </ThemedText>
            <Pressable onPress={() => router.replace('/(auth)/signup')}>
              <ThemedText type="link">Sign Up</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  formError: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
