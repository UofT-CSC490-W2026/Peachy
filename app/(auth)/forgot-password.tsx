import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { AuthButton } from '@/components/auth/auth-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateEmail, validatePassword, validatePasswordMatch, validateResetCode } from '@/utils/validation';

const SEND_CODE_COOLDOWN = 60; // seconds

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, resetPassword } = useAuth();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cooldown for "Send Reset Code"
  const [sendCooldownUntil, setSendCooldownUntil] = useState<number | null>(null);
  const [sendCountdown, setSendCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sendCooldownUntil === null) return;
    const tick = () => {
      const remaining = Math.ceil((sendCooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setSendCountdown(0);
        setSendCooldownUntil(null);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setSendCountdown(remaining);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sendCooldownUntil]);

  const isSendLocked = sendCooldownUntil !== null && Date.now() < sendCooldownUntil;

  const handleSendCode = async () => {
    if (isSendLocked) return;
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    setErrors({});
    setFormError(null);
    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSendCooldownUntil(Date.now() + SEND_CODE_COOLDOWN * 1000);
        setStep('reset');
      } else {
        setFormError(result.error ?? 'Failed to send reset code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    const codeError = validateResetCode(code);
    if (codeError) newErrors.code = codeError;
    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;
    const matchError = validatePasswordMatch(newPassword, confirmPassword);
    if (matchError) newErrors.confirmPassword = matchError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setIsLoading(true);
    try {
      const result = await resetPassword(email, code.trim(), newPassword);
      if (result.success) {
        setStep('done');
      } else {
        setFormError(result.error ?? 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Success ───────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centeredContent}>
          <View style={[styles.successIcon, { backgroundColor: `${successColor}15` }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={successColor} />
          </View>
          <ThemedText type="title" style={styles.centeredTitle}>Password reset!</ThemedText>
          <ThemedText style={[styles.centeredMessage, { color: textSecondary }]}>
            Your password has been updated. You can now log in with your new password.
          </ThemedText>
          <AuthButton title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => step === 'reset' ? setStep('email') : router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Reset Password
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 1: Enter email ── */}
          {step === 'email' && (
            <>
              <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
                Enter your email address and we'll send you a 6-digit reset code.
              </ThemedText>

              <FormField label="Email" required>
                <FormTextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                />
              </FormField>

              <AuthButton
                title={isSendLocked ? `Resend in ${sendCountdown}s` : 'Send Reset Code'}
                onPress={handleSendCode}
                loading={isLoading && !isSendLocked}
              />

              {formError && (
                <ThemedText style={[styles.formError, { color: dangerColor }]}>
                  {formError}
                </ThemedText>
              )}
            </>
          )}

          {/* ── Step 2: Enter code + new password ── */}
          {step === 'reset' && (
            <>
              <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
                Enter the 6-digit code sent to {email} and choose a new password.
              </ThemedText>

              <FormField label="Reset Code" required>
                <FormTextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.code}
                />
              </FormField>

              <FormField label="New Password" required>
                <FormTextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="8+ chars, uppercase, number, symbol"
                  secureTextEntry
                  autoComplete="new-password"
                  showToggle
                  error={errors.newPassword}
                />
              </FormField>

              <FormField label="Confirm New Password" required>
                <FormTextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  secureTextEntry
                  autoComplete="new-password"
                  showToggle
                  error={errors.confirmPassword}
                />
              </FormField>

              <AuthButton title="Reset Password" onPress={handleResetPassword} loading={isLoading} />

              {formError && (
                <ThemedText style={[styles.formError, { color: dangerColor }]}>
                  {formError}
                </ThemedText>
              )}
            </>
          )}

          <View style={styles.footer}>
            <ThemedText style={{ color: textSecondary }}>
              Remember your password?{' '}
            </ThemedText>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <ThemedText type="link">Log In</ThemedText>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
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
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  centeredTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  centeredMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
});
