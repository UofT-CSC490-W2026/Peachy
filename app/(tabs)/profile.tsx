import { StyleSheet, View, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { useInterests } from '@/hooks/use-interests';
import { INTEREST_CATEGORIES } from '@/constants/interests';

function HamburgerIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={16} viewBox="0 0 22 16">
      <Rect x="0" y="0" width="22" height="2" rx="1" fill={color} />
      <Rect x="0" y="7" width="22" height="2" rx="1" fill={color} />
      <Rect x="0" y="14" width="22" height="2" rx="1" fill={color} />
    </Svg>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const { selected } = useInterests();

  // Filter categories to only those with at least one selected tag, max 20 total
  let remaining = 20;
  const categoriesWithTags = INTEREST_CATEGORIES
    .map((cat) => ({
      ...cat,
      tags: cat.tags.filter((t) => selected.has(t.id)),
    }))
    .filter((cat) => cat.tags.length > 0);

  const hasInterests = categoriesWithTags.length > 0;

  return (
    <ThemedView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <ThemedText style={styles.usernameTop}>@{user?.username}</ThemedText>
        <Pressable style={styles.menuButton} onPress={() => router.push('/settings')}>
          <HamburgerIcon color={textColor} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={[styles.avatar, { borderColor }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: surfaceColor, borderColor }]}>
              <ThemedText style={styles.avatarInitial}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </ThemedText>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>0</ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>followers</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>0</ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>following</ThemedText>
            </View>
          </View>
        </View>

        {/* Name */}
        <ThemedText style={styles.name}>{user?.name}</ThemedText>

        {/* Edit Profile button */}
        <Pressable
          style={[styles.editButton, { borderColor }]}
          onPress={() => router.push('/profile-edit')}
        >
          <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
        </Pressable>

        {/* Interests grouped by category — read-only */}
        {hasInterests && (
          <View style={styles.interestsSection}>
            <ThemedText style={[styles.interestsHeading, { color: textSecondary }]}>INTERESTS</ThemedText>
            {categoriesWithTags.map((cat) => {
              const visible = cat.tags.slice(0, remaining);
              remaining -= visible.length;
              if (visible.length === 0) return null;
              return (
                <View key={cat.id} style={styles.category}>
                  <ThemedText style={[styles.categoryLabel, { color: textSecondary }]}>
                    {cat.label}
                  </ThemedText>
                  <View style={styles.tagsWrap}>
                    {visible.map((tag) => (
                      <View
                        key={tag.id}
                        style={[styles.tag, { backgroundColor: `${tintColor}18`, borderColor: `${tintColor}40` }]}
                      >
                        <ThemedText style={[styles.tagLabel, { color: tintColor }]}>
                          {tag.label}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  topBarSpacer: { width: 40 },
  usernameTop: { fontSize: 17, fontWeight: '700' },
  menuButton: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 24,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 1 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarInitial: { fontSize: 36, fontWeight: '600' },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 14 },
  editButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 28,
  },
  editButtonText: { fontSize: 15, fontWeight: '600' },
  interestsSection: { gap: 16 },
  interestsHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  category: { gap: 8 },
  categoryLabel: { fontSize: 13, fontWeight: '600' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagLabel: { fontSize: 13, fontWeight: '600' },
});
