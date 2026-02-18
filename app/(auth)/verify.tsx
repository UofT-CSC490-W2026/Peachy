import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { AuthButton } from '@/components/auth/auth-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateResetCode } from '@/utils/validation';

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { confirmSignup, resendCode, isLoading } = useAuth();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Resend cooldown
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendCooldownUntil === null) return;
    const tick = () => {
      const remaining = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setResendCountdown(0);
        setResendCooldownUntil(null);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setResendCountdown(remaining);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resendCooldownUntil]);

  const isResendLocked = resendCooldownUntil !== null && Date.now() < resendCooldownUntil;

  const handleVerify = async () => {
    const codeError = validateResetCode(code);
    if (codeError) {
      setError(codeError);
      return;
    }
    setError(null);
    setResendMessage(null);

    const result = await confirmSignup(email ?? '', code.trim());
    if (result.success) {
      setVerified(true);
    } else {
      setError(result.error ?? 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (isResendLocked) return;
    setError(null);
    setResendMessage(null);
    const result = await resendCode(email ?? '');
    if (result.success) {
      setResendCooldownUntil(Date.now() + RESEND_COOLDOWN * 1000);
      setResendMessage('A new code has been sent to your email');
    } else {
      setError(result.error ?? 'Failed to resend code');
    }
  };

  if (verified) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: `${successColor}15` }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={successColor} />
          </View>
          <ThemedText type="title" style={styles.successTitle}>Email verified!</ThemedText>
          <ThemedText style={[styles.successMessage, { color: textSecondary }]}>
            Your account is ready. Log in to get started.
          </ThemedText>
          <AuthButton title="Log In" onPress={() => router.replace('/(auth)/login')} />
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Verify Email
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            We sent a 6-digit code to{' '}
            <ThemedText style={styles.emailHighlight}>{email}</ThemedText>
            {'. '}Enter it below to verify your account.
          </ThemedText>

          <FormField label="Verification Code" required>
            <FormTextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
            />
          </FormField>

          {resendMessage && (
            <ThemedText style={[styles.resendMessage, { color: successColor }]}>
              {resendMessage}
            </ThemedText>
          )}

          <AuthButton title="Verify" onPress={handleVerify} loading={isLoading} />

          <View style={styles.footer}>
            <ThemedText style={{ color: textSecondary }}>
              Didn't receive a code?{' '}
            </ThemedText>
            <Pressable onPress={handleResend} disabled={isResendLocked}>
              <ThemedText type="link">
                {isResendLocked ? `Resend in ${resendCountdown}s` : 'Resend'}
              </ThemedText>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  emailHighlight: {
    fontWeight: '600',
  },
  resendMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  successContent: {
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
  successTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
});
