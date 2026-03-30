import { StyleSheet, View, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { useCalendar } from '@/contexts/calendar-context';
import { INTEREST_CATEGORIES } from '@/constants/interests';
import { User } from '@/types';

export default function FriendProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const successColor = useThemeColor({}, 'success');
  const { user: currentUser } = useAuth();
  const { calendars, fetchUser } = useCalendar();

  const [friend, setFriend] = useState<User | undefined>();
  const [isLoading, setIsLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchUser(userId)
      .then(u => setFriend(u))
      .finally(() => setIsLoading(false));
  }, [userId, fetchUser]);

  const mutualCalendarCount = useMemo(() => {
    if (!currentUser || !userId) return 0;
    return calendars.filter(
      c => c.type === 'shared' && c.memberIds.includes(userId),
    ).length;
  }, [calendars, currentUser, userId]);

  const selected = useMemo(() => new Set(friend?.interests ?? []), [friend?.interests]);

  const { categoriesWithTags, hasInterests } = useMemo(() => {
    let remaining = 20;
    const cats = INTEREST_CATEGORIES
      .map(cat => ({ ...cat, tags: cat.tags.filter(t => selected.has(t.id)) }))
      .filter(cat => cat.tags.length > 0)
      .map(cat => {
        const visible = cat.tags.slice(0, remaining);
        remaining -= visible.length;
        return { ...cat, tags: visible };
      })
      .filter(cat => cat.tags.length > 0);
    return { categoriesWithTags: cats, hasInterests: cats.length > 0 };
  }, [selected]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </ThemedView>
    );
  }

  if (!friend) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textSecondary }}>User not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          @{friend.username}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.profileHeader}>
          {friend.avatarUrl ? (
            <Image source={{ uri: friend.avatarUrl }} style={[styles.avatar, { borderColor }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: surfaceColor, borderColor }]}>
              <ThemedText style={styles.avatarInitial}>
                {friend.name?.charAt(0)?.toUpperCase() ?? '?'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Name */}
        <ThemedText style={styles.name}>{friend.name}</ThemedText>

        {/* Bio */}
        {friend.bio ? (
          <ThemedText style={[styles.bio, { color: textSecondary }]}>{friend.bio}</ThemedText>
        ) : null}

        {/* Mutual calendars badge */}
        {mutualCalendarCount > 0 && (
          <View style={[styles.mutualBadge, { backgroundColor: `${successColor}14`, borderColor: `${successColor}40` }]}>
            <IconSymbol name="calendar" size={14} color={successColor} />
            <ThemedText style={[styles.mutualText, { color: successColor }]}>
              {mutualCalendarCount} mutual {mutualCalendarCount === 1 ? 'calendar' : 'calendars'}
            </ThemedText>
          </View>
        )}

        {/* Interests */}
        {hasInterests && (
          <View style={styles.interestsSection}>
            <ThemedText style={[styles.interestsHeading, { color: textSecondary }]}>INTERESTS</ThemedText>
            {categoriesWithTags.map(cat => (
              <View key={cat.id} style={styles.category}>
                <ThemedText style={[styles.categoryLabel, { color: textSecondary }]}>
                  {cat.label}
                </ThemedText>
                <View style={styles.tagsWrap}>
                  {cat.tags.map(tag => (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18 },
  headerSpacer: { width: 36 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
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
  name: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  bio: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 14 },
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  mutualText: { fontSize: 13, fontWeight: '600' },
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
