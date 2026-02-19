import { StyleSheet, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// C3: Prop typed as IconSymbolName so the icon name is checked at compile-time
// instead of silently cast with `as any`.
function FeatureItem({ icon, text }: { icon: IconSymbolName; text: string }) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: `${tintColor}15` }]}>
        <IconSymbol name={icon} size={20} color={tintColor} />
      </View>
      <ThemedText style={[styles.featureText, { color: textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
        />

        <ThemedText type="title" style={styles.title}>Peachy</ThemedText>
        <ThemedText style={[styles.tagline, { color: textSecondary }]}>
          Intelligent calendar with AI scheduling
        </ThemedText>

        <View style={styles.features}>
          <FeatureItem icon="sparkles" text="AI-powered natural language scheduling" />
          <FeatureItem icon="calendar" text="Shared calendars for teams and family" />
          <FeatureItem icon="bubble.left.fill" text="Built-in messaging and invites" />
        </View>
      </View>

      <View style={styles.bottom}>
        <AuthButton title="Get Started" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 48,
  },
  features: {
    alignSelf: 'stretch',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  bottom: {
    paddingTop: 24,
  },
});
