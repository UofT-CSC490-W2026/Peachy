import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGoogleCalendar, type GoogleCalendarItem } from '@/contexts/google-calendar-context';
import { useCalendar } from '@/contexts/calendar-context';

type ScreenMode = 'manage' | 'add';

export default function GoogleCalendarLinkScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const dangerColor = useThemeColor({}, 'danger');
  const successColor = useThemeColor({}, 'success');

  const { isLinked, listCalendars, selectCalendars, unlinkCalendar, disconnect, startLink, isLinking } = useGoogleCalendar();
  const { calendars: peachyCalendars, refreshCalendars } = useCalendar();

  // Google calendars available to add
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mode, setMode] = useState<ScreenMode>('manage');

  // Calendars already synced from Google
  const linkedCalendars = peachyCalendars.filter(c => !!c.googleCalendarId);
  const linkedGoogleIds = new Set(linkedCalendars.map(c => c.googleCalendarId!));

  useEffect(() => {
    if (!isLinked || hasLoaded) return;
    setHasLoaded(true);
    loadGoogleCalendars();
  }, [isLinked, hasLoaded]);

  const loadGoogleCalendars = async () => {
    setIsLoadingCalendars(true);
    setLoadError(null);
    try {
      const items = await listCalendars();
      setGoogleCalendars(items);
      // Pre-select calendars not already linked
      setSelectedIds(items.filter(c => !linkedGoogleIds.has(c.id)).map(c => c.id));
    } catch (err: any) {
      setLoadError(err?.message ?? 'Failed to load calendars');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const toggleCalendar = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Select Calendars', 'Please select at least one calendar to sync.');
      return;
    }
    setIsSaving(true);
    try {
      const selectedCalendars = googleCalendars
        .filter(c => selectedIds.includes(c.id))
        .map(c => ({ id: c.id, name: c.name, color: c.color }));
      await selectCalendars(selectedCalendars);
      await refreshCalendars();
      setMode('manage');
      setSelectedIds([]);
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.message ?? 'Could not link calendars. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlink = (peachyCalendarId: string, name: string) => {
    Alert.alert(
      'Remove Calendar',
      `Remove "${name}" from Peachy? Events imported from this calendar will be deleted. Your Google Calendar is not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkCalendar(peachyCalendarId);
              await refreshCalendars();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to remove calendar.');
            }
          },
        },
      ],
    );
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

  // ── Not yet linked ────────────────────────────────────────────────────────────
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
            onPress={() => startLink()}
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

  // ── Manage mode: show linked calendars ───────────────────────────────────────
  if (mode === 'manage') {
    return (
      <ThemedView style={styles.container}>
        <Header onBack={() => router.back()} title="Google Calendar" />
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Synced Calendars</ThemedText>
            <ThemedText style={[styles.sectionSub, { color: textSecondary }]}>
              Tap a calendar to remove it from Peachy.
            </ThemedText>
          </View>

          {linkedCalendars.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No calendars synced yet.
            </ThemedText>
          ) : (
            linkedCalendars.map(cal => (
              <View key={cal.id} style={[styles.calendarRow, { backgroundColor: surfaceColor, borderColor }]}>
                <View style={[styles.colorSwatch, { backgroundColor: cal.color }]} />
                <View style={styles.calendarInfo}>
                  <ThemedText style={styles.calendarName}>{cal.name}</ThemedText>
                  <ThemedText style={[styles.primaryBadge, { color: successColor }]}>Synced</ThemedText>
                </View>
                <Pressable
                  onPress={() => handleUnlink(cal.id, cal.name)}
                  hitSlop={8}
                >
                  <IconSymbol name="xmark" size={16} color={dangerColor} />
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: tintColor }]}
              onPress={() => setMode('add')}
            >
              <ThemedText style={styles.primaryButtonText}>Add More Calendars</ThemedText>
            </Pressable>
            <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
              <ThemedText style={[styles.disconnectText, { color: dangerColor }]}>
                Disconnect Google Calendar
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // ── Add mode: pick new calendars to sync ─────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      <Header onBack={() => setMode('manage')} title="Add Calendars" />

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
          <Pressable style={[styles.retryButton, { borderColor }]} onPress={loadGoogleCalendars}>
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {googleCalendars.map(item => {
            const alreadyLinked = linkedGoogleIds.has(item.id);
            const isSelected = selectedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={[styles.calendarRow, { backgroundColor: surfaceColor, borderColor }, alreadyLinked && styles.rowDisabled]}
                onPress={() => !alreadyLinked && toggleCalendar(item.id)}
                disabled={alreadyLinked}
              >
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
                <View style={styles.calendarInfo}>
                  <ThemedText style={styles.calendarName}>{item.name}</ThemedText>
                  {alreadyLinked ? (
                    <ThemedText style={[styles.primaryBadge, { color: successColor }]}>Already synced</ThemedText>
                  ) : item.primary ? (
                    <ThemedText style={[styles.primaryBadge, { color: textSecondary }]}>Primary</ThemedText>
                  ) : null}
                </View>
                {!alreadyLinked && (
                  <View style={[
                    styles.checkbox,
                    { borderColor: isSelected ? tintColor : borderColor },
                    isSelected && { backgroundColor: tintColor },
                  ]}>
                    {isSelected && <IconSymbol name="checkmark" size={12} color="#fff" />}
                  </View>
                )}
              </Pressable>
            );
          })}

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: tintColor }, (isSaving || selectedIds.length === 0) && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving || selectedIds.length === 0}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Sync {selectedIds.length} Calendar{selectedIds.length !== 1 ? 's' : ''}
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
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

  emptyText: { textAlign: 'center', fontSize: 14, paddingHorizontal: 20, paddingVertical: 12 },

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
  rowDisabled: { opacity: 0.5 },
  colorSwatch: { width: 14, height: 14, borderRadius: 7 },
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

  footer: { paddingTop: 16, gap: 12 },
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
