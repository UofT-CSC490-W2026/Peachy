import { StyleSheet, View, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { useFriends } from '@/contexts/friends-context';
import { useCalendar } from '@/contexts/calendar-context';
import { INTEREST_CATEGORIES } from '@/constants/interests';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const { user, fetchProfile } = useAuth();
  const { friends } = useFriends();
  const { calendars } = useCalendar();

  const sharedCalendarCount = useMemo(
    () => calendars.filter(c => c.type === 'shared').length,
    [calendars],
  );

  // Derive selected interests directly from context — always in sync after save
  const selected = useMemo(() => new Set(user?.interests ?? []), [user?.interests]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProfile().catch(() => {});
    setIsRefreshing(false);
  }, [fetchProfile]);

  // Refresh profile data whenever this screen comes into focus
  useFocusEffect(useCallback(() => {
    fetchProfile().catch(() => {});
  }, [fetchProfile]));

  const { categoriesWithTags, hasInterests } = useMemo(() => {
    let remaining = 20;
    const cats = INTEREST_CATEGORIES
      .map((cat) => ({
        ...cat,
        tags: cat.tags.filter((t) => selected.has(t.id)),
      }))
      .filter((cat) => cat.tags.length > 0)
      .map((cat) => {
        const visible = cat.tags.slice(0, remaining);
        remaining -= visible.length;
        return { ...cat, tags: visible };
      })
      .filter((cat) => cat.tags.length > 0);
    return { categoriesWithTags: cats, hasInterests: cats.length > 0 };
  }, [selected]);

  return (
    <ThemedView style={styles.container}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: borderColor,
            backgroundColor: surfaceColor,
          },
        ]}
      >
        <View style={styles.topBarSpacer} />
        <ThemedText style={styles.usernameTop} numberOfLines={1}>@{user?.username}</ThemedText>
        <Pressable
          style={[styles.menuButton, { borderColor, backgroundColor: surfaceColor }]}
          onPress={() => router.push('/settings')}
        >
          <IconSymbol name="line.horizontal.3" size={22} color={textColor} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
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
            <Pressable style={styles.statItem} onPress={() => router.push('/friends')}>
              <ThemedText style={styles.statNumber}>{friends.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>friends</ThemedText>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{sharedCalendarCount}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                shared {sharedCalendarCount === 1 ? 'calendar' : 'calendars'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Name */}
        <ThemedText style={styles.name}>{user?.name}</ThemedText>

        {/* Bio */}
        {user?.bio ? (
          <ThemedText style={[styles.bio, { color: textSecondary }]}>{user.bio}</ThemedText>
        ) : null}

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
            {categoriesWithTags.map((cat) => (
                <View key={cat.id} style={styles.category}>
                  <ThemedText style={[styles.categoryLabel, { color: textSecondary }]}>
                    {cat.label}
                  </ThemedText>
                  <View style={styles.tagsWrap}>
                    {cat.tags.map((tag) => (
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
            ))}
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
    minHeight: 112,
    borderBottomWidth: 1,
  },
  topBarSpacer: { width: 40 },
  usernameTop: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  avatarInitial: { fontSize: 28, fontWeight: '600' },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, borderRadius: 0.5 },
  statNumber: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  bio: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  editButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 28,
  },
  editButtonText: { fontSize: 13, fontWeight: '600' },
  interestsSection: { gap: 16 },
  interestsHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  category: { gap: 8 },
  categoryLabel: { fontSize: 12, fontWeight: '600' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagLabel: { fontSize: 11, fontWeight: '600' },
});
