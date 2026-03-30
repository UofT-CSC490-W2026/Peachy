import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGoogleCalendar } from '@/contexts/google-calendar-context';

export default function GoogleCalendarPromptScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const { startLink, isLinking } = useGoogleCalendar();

  const handleLink = async () => {
    const linked = await startLink();
    if (linked) {
      // Replace this screen with calendar selection
      router.replace('/google-calendar-link');
    }
    // If user cancelled, stay on this screen
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${tintColor}18` }]}>
          <IconSymbol name="calendar.badge.plus" size={40} color={tintColor} />
        </View>

        {/* Heading */}
        <ThemedText style={styles.heading}>Import Google Calendar?</ThemedText>
        <ThemedText style={[styles.body, { color: textSecondary }]}>
          Link your Google Calendar to see all your events in Peachy. Choose which calendars to sync — changes stay in sync automatically.
        </ThemedText>

        {/* Feature bullets */}
        <View style={[styles.bullets, { backgroundColor: surfaceColor, borderColor }]}>
          <BulletRow icon="arrow.2.circlepath" text="Events sync in both directions" tint={tintColor} />
          <BulletRow icon="paintpalette.fill" text="Calendars import with original colors" tint={tintColor} />
          <BulletRow icon="checkmark.shield.fill" text="Disconnect any time from Settings" tint={tintColor} />
        </View>

        {/* Actions */}
        <Pressable
          style={[styles.primaryButton, { backgroundColor: tintColor }, isLinking && styles.buttonDisabled]}
          onPress={handleLink}
          disabled={isLinking}
          accessibilityRole="button"
          accessibilityLabel="Link Google Calendar"
        >
          {isLinking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Link Google Calendar</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <ThemedText style={[styles.skipText, { color: textSecondary }]}>Skip for now</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function BulletRow({ icon, text, tint }: { icon: string; text: string; tint: string }) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  return (
    <View style={styles.bulletRow}>
      <IconSymbol name={icon} size={16} color={tint} />
      <ThemedText style={[styles.bulletText, { color: textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  bullets: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.6 },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 15,
  },
});
