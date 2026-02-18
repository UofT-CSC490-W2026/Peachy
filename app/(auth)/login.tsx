import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { AuthTextInput } from '@/components/auth/auth-text-input';
import { AuthButton } from '@/components/auth/auth-button';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { validateLoginForm } from '@/utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(e => { errorMap[e.field] = e.message; });
      setErrors(errorMap);
      return;
    }
    setErrors({});

    const result = await login(email, password);
    if (!result.success) {
      if (result.pendingVerification) {
        router.push({ pathname: '/(auth)/verify' as never, params: { email } });
      } else {
        Alert.alert('Login Failed', result.error);
      }
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
            <AuthTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
          </FormField>

          <FormField label="Password" required>
            <AuthTextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />
          </FormField>

          <Pressable
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <ThemedText type="link">Forgot password?</ThemedText>
          </Pressable>

          <AuthButton title="Log In" onPress={handleLogin} loading={isLoading} />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
            <ThemedText style={[styles.dividerText, { color: textSecondary }]}>or</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
          </View>

          <AuthButton
            title="Continue with Google"
            variant="google"
            onPress={() => Alert.alert('Google Sign-In', 'Google sign-in will be available soon.')}
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
});
