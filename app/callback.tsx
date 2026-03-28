import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OAuthCallbackScreen() {
  const { code, error: oauthError } = useLocalSearchParams<{ code?: string; error?: string }>();
  const { exchangeOAuthCode } = useAuth();
  const router = useRouter();
  const dangerColor = useThemeColor({}, 'danger');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (oauthError) {
      setError(`Google sign-in failed: ${oauthError}`);
      return;
    }
    if (!code) {
      setError('No authorization code received');
      return;
    }

    exchangeOAuthCode(code).then((result) => {
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error ?? 'Google sign-in failed');
      }
    });
  }, [code, oauthError, exchangeOAuthCode, router]);

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.error, { color: dangerColor }]}>{error}</ThemedText>
        <ThemedText
          type="link"
          style={styles.link}
          onPress={() => router.replace('/(auth)/login')}
        >
          Back to Login
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" />
      <ThemedText style={styles.text}>Signing in...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
});
