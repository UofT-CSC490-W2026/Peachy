import { StyleSheet, View, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';

// ─── Row types ────────────────────────────────────────────────────────────────

interface RowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
}

function Row({ icon, title, subtitle, onPress, right, showChevron = true }: RowProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      style={[styles.row, { backgroundColor: surfaceColor, borderColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${tintColor}18` }]}>
        <IconSymbol name={icon} size={19} color={tintColor} />
      </View>
      <View style={styles.rowContent}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={[styles.rowSubtitle, { color: textSecondary }]}>{subtitle}</ThemedText>
        )}
      </View>
      {right ?? (showChevron && onPress ? (
        <IconSymbol name="chevron.right" size={18} color={textSecondary} />
      ) : null)}
    </Pressable>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>{title}</ThemedText>
      {children}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const { logout } = useAuth();

  const soon = (feature: string) => () => Alert.alert(feature, 'Coming soon');

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={textColor} />
        </Pressable>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── APPEARANCE ── */}
        <Section title="APPEARANCE">
          <Row
            icon="paintbrush.fill"
            title="Appearance"
            subtitle="Theme, text size, and display"
            onPress={() => router.push('/appearance')}
          />
        </Section>

        {/* ── ACCOUNT ── */}
        <Section title="ACCOUNT">
          <Row
            icon="person.crop.circle"
            title="Edit Profile"
            subtitle="Update your name, photo, and bio"
            onPress={() => router.push('/profile-edit')}
          />
          <Row
            icon="bell.fill"
            title="Notifications"
            subtitle="Push, email, and in-app alerts"
            onPress={soon('Notifications')}
          />
          <Row
            icon="calendar.badge.plus"
            title="Calendar Sync"
            subtitle="Connect Google, Apple, or Outlook"
            onPress={soon('Calendar Sync')}
          />
          <Row
            icon="link"
            title="Linked Accounts"
            subtitle="Manage connected apps and services"
            onPress={soon('Linked Accounts')}
          />
        </Section>

        {/* ── CALENDAR & AI ── */}
        <Section title="CALENDAR & AI">
          <Row
            icon="calendar"
            title="Default View"
            subtitle="Day, week, or month"
            onPress={soon('Default View')}
          />
          <Row
            icon="clock.fill"
            title="Working Hours"
            subtitle="Set your availability for AI scheduling"
            onPress={soon('Working Hours')}
          />
          <Row
            icon="sparkles"
            title="AI Scheduling"
            subtitle="Smart suggestions and auto-scheduling"
            onPress={soon('AI Scheduling')}
          />
          <Row
            icon="1.circle"
            title="Week Starts On"
            subtitle="Sunday or Monday"
            onPress={soon('Week Starts On')}
          />
        </Section>

        {/* ── SOCIAL ── */}
        <Section title="SOCIAL">
          <Row
            icon="person.2.fill"
            title="Who Can Follow Me"
            subtitle="Everyone or approved followers only"
            onPress={soon('Who Can Follow Me')}
          />
          <Row
            icon="eye.fill"
            title="Profile Visibility"
            subtitle="Control what others can see"
            onPress={soon('Profile Visibility')}
          />
          <Row
            icon="chart.bar.fill"
            title="Activity Sharing"
            subtitle="Share events and availability with followers"
            onPress={soon('Activity Sharing')}
          />
        </Section>

        {/* ── PRIVACY & SECURITY ── */}
        <Section title="PRIVACY & SECURITY">
          <Row
            icon="lock.fill"
            title="Privacy Settings"
            subtitle="Manage your data and permissions"
            onPress={soon('Privacy Settings')}
          />
          <Row
            icon="hand.raised.fill"
            title="Blocked Users"
            subtitle="Manage your block list"
            onPress={soon('Blocked Users')}
          />
          <Row
            icon="key.fill"
            title="Change Password"
            onPress={soon('Change Password')}
          />
        </Section>

        {/* ── SUPPORT ── */}
        <Section title="SUPPORT">
          <Row
            icon="questionmark.circle.fill"
            title="Help & Support"
            subtitle="FAQs and contact support"
            onPress={soon('Help & Support')}
          />
          <Row
            icon="star.fill"
            title="Rate Peachy"
            subtitle="Enjoying the app? Leave a review"
            onPress={soon('Rate Peachy')}
          />
          <Row
            icon="info.circle.fill"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('About', 'Peachy v1.0.0\nIntelligent calendar with AI scheduling')}
          />
        </Section>

        {/* Log Out */}
        <Pressable
          style={[styles.logoutButton, { borderColor }]}
          onPress={handleLogout}
          accessibilityLabel="Log out from your account"
          accessibilityRole="button"
        >
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </Pressable>

      </ScrollView>
    </ThemedView>
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
  title: { fontSize: 17, fontWeight: '700' },
  topBarSpacer: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  section: { marginTop: 28 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 1 },
  logoutButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
});
