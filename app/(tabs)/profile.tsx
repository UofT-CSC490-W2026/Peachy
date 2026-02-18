import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { currentUser } from '@/data/mock-data';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showChevron = true }: SettingItemProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      style={[styles.settingItem, { backgroundColor: surfaceColor, borderColor }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${tintColor}15` }]}>
        <IconSymbol name={icon} size={20} color={tintColor} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={[styles.settingSubtitle, { color: textSecondary }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {showChevron && (
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const { logout } = useAuth();

  const handleEditProfile = () => {
    router.push('/profile-edit');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Feature coming soon');
  };

  const handleCalendarSync = () => {
    Alert.alert('Calendar Sync', 'Feature coming soon');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy & Security', 'Feature coming soon');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Feature coming soon');
  };

  const handleAbout = () => {
    Alert.alert('About', 'Peachy v1.0.0\nIntelligent calendar with AI scheduling');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: surfaceColor, borderColor }]}>
            <ThemedText type="title">{currentUser.name.charAt(0)}</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.name}>{currentUser.name}</ThemedText>
          <ThemedText lightColor="#687076" darkColor="#9BA1A6" style={styles.username}>
            @{currentUser.username}
          </ThemedText>
          <ThemedText lightColor="#687076" darkColor="#9BA1A6" style={styles.email}>
            {currentUser.email}
          </ThemedText>
          <Pressable
            style={[styles.editButton, { backgroundColor: tintColor }]}
            onPress={handleEditProfile}
          >
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </Pressable>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            ACCOUNT
          </ThemedText>
          <SettingItem
            icon="bell"
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={handleNotifications}
          />
          <SettingItem
            icon="calendar"
            title="Calendar Sync"
            subtitle="Sync with Google, Apple, Outlook"
            onPress={handleCalendarSync}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            PRIVACY & SECURITY
          </ThemedText>
          <SettingItem
            icon="person.fill"
            title="Privacy & Security"
            subtitle="Control your data and privacy"
            onPress={handlePrivacy}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            SUPPORT
          </ThemedText>
          <SettingItem
            icon="bubble.left.fill"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={handleHelp}
          />
          <SettingItem
            icon="note.text"
            title="About"
            subtitle="Version and app information"
            onPress={handleAbout}
          />
        </View>

        {/* Log Out */}
        <Pressable
          style={[styles.logoutButton, { borderColor }]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  name: {
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
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
