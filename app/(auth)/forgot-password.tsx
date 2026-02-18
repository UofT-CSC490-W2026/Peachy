import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { AuthButton } from '@/components/auth/auth-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: `${successColor}15` }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={successColor} />
          </View>
          <ThemedText type="title" style={styles.successTitle}>Check your email</ThemedText>
          <ThemedText style={[styles.successMessage, { color: textSecondary }]}>
            We've sent a password reset link to {email}. Check your inbox and follow the instructions.
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
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
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Enter your email address and we'll send you a link to reset your password.
          </ThemedText>

          <FormField label="Email" required>
            <AuthTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
            />
          </FormField>

          <AuthButton title="Send Reset Link" onPress={handleSubmit} loading={isLoading} />

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
