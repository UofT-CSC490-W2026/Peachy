import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGoogleCalendar, type GoogleCalendarItem } from '@/contexts/google-calendar-context';
import { useCalendar } from '@/contexts/calendar-context';

export default function GoogleCalendarLinkScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const dangerColor = useThemeColor({}, 'danger');

  const { isLinked, listCalendars, selectCalendars, disconnect, startLink, isLinking } = useGoogleCalendar();
  const { refreshCalendars } = useCalendar();

  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google calendars once we're in the linked state
  useEffect(() => {
    if (!isLinked) return;
    loadCalendars();
  }, [isLinked]);

  const loadCalendars = async () => {
    setIsLoadingCalendars(true);
    setLoadError(null);
    try {
      const items = await listCalendars();
      setCalendars(items);
      // Pre-select all by default
      setSelected(new Set(items.map(c => c.id)));
    } catch (err: any) {
      setLoadError(err?.message ?? 'Failed to load calendars');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const toggleCalendar = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      Alert.alert('Select Calendars', 'Please select at least one calendar to sync.');
      return;
    }
    setIsSaving(true);
    try {
      await selectCalendars([...selected]);
      await refreshCalendars();
      router.back();
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.message ?? 'Could not link calendars. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'This will remove all synced Google Calendar events from Peachy. Your Google Calendar is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect();
              await refreshCalendars();
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to disconnect. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleStartLink = async () => {
    const linked = await startLink();
    if (linked) {
      loadCalendars();
    }
  };

  // ── Not yet linked — show link button ────────────────────────────────────────
  if (!isLinked) {
    return (
      <ThemedView style={styles.container}>
        <Header onBack={() => router.back()} title="Google Calendar" />
        <View style={styles.centeredContent}>
          <View style={[styles.iconWrap, { backgroundColor: `${tintColor}18` }]}>
            <IconSymbol name="calendar.badge.plus" size={36} color={tintColor} />
          </View>
          <ThemedText style={styles.heading}>Not linked yet</ThemedText>
          <ThemedText style={[styles.subheading, { color: textSecondary }]}>
            Connect your Google account to sync calendars and events with Peachy.
          </ThemedText>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: tintColor }, isLinking && styles.buttonDisabled]}
            onPress={handleStartLink}
            disabled={isLinking}
          >
            {isLinking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Link Google Calendar</ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // ── Linked — show calendar selection ─────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      <Header onBack={() => router.back()} title="Google Calendar" />

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Choose calendars to sync</ThemedText>
        <ThemedText style={[styles.sectionSub, { color: textSecondary }]}>
          Peachy will create matching calendars and keep events in sync automatically.
        </ThemedText>
      </View>

      {isLoadingCalendars ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>Loading calendars…</ThemedText>
        </View>
      ) : loadError ? (
        <View style={styles.centeredContent}>
          <ThemedText style={[styles.errorText, { color: dangerColor }]}>{loadError}</ThemedText>
          <Pressable style={[styles.retryButton, { borderColor }]} onPress={loadCalendars}>
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={calendars}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.calendarRow, { backgroundColor: surfaceColor, borderColor }]}
              onPress={() => toggleCalendar(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected.has(item.id) }}
            >
              {/* Color swatch */}
              <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />

              <View style={styles.calendarInfo}>
                <ThemedText style={styles.calendarName}>{item.name}</ThemedText>
                {item.primary && (
                  <ThemedText style={[styles.primaryBadge, { color: textSecondary }]}>Primary</ThemedText>
                )}
              </View>

              {/* Checkbox */}
              <View style={[
                styles.checkbox,
                { borderColor: selected.has(item.id) ? tintColor : borderColor },
                selected.has(item.id) && { backgroundColor: tintColor },
              ]}>
                {selected.has(item.id) && (
                  <IconSymbol name="checkmark" size={12} color="#fff" />
                )}
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {/* Sync button */}
              <Pressable
                style={[styles.primaryButton, { backgroundColor: tintColor }, (isSaving || selected.size === 0) && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving || selected.size === 0}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Sync {selected.size} Calendar{selected.size !== 1 ? 's' : ''}
                  </ThemedText>
                )}
              </Pressable>

              {/* Disconnect */}
              <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
                <ThemedText style={[styles.disconnectText, { color: dangerColor }]}>
                  Disconnect Google Calendar
                </ThemedText>
              </Pressable>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  const textColor = useThemeColor({}, 'text');
  return (
    <View style={styles.topBar}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <IconSymbol name="chevron.left" size={22} color={textColor} />
      </Pressable>
      <ThemedText style={styles.topBarTitle}>{title}</ThemedText>
      <View style={styles.topBarSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  topBarSpacer: { width: 40 },

  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  subheading: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 24 },

  sectionHeader: { paddingHorizontal: 20, paddingBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sectionSub: { fontSize: 13, lineHeight: 18 },

  list: { paddingHorizontal: 20, paddingBottom: 24 },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  calendarInfo: { flex: 1 },
  calendarName: { fontSize: 15, fontWeight: '600' },
  primaryBadge: { fontSize: 12, marginTop: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: { paddingTop: 8, gap: 12 },
  primaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },

  disconnectButton: { alignItems: 'center', paddingVertical: 10 },
  disconnectText: { fontSize: 14, fontWeight: '500' },

  loadingText: { marginTop: 14, fontSize: 15 },
  errorText: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: { fontSize: 15, fontWeight: '600' },
});
