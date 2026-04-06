import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { useAuth } from '@/contexts/auth-context';
import { AuthError, createApiClient } from '@/utils/api-client';
import type { User, Calendar } from '@/types';

export default function ChatMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ calendarId: string }>();
  const calendarId = Array.isArray(params.calendarId) ? params.calendarId[0] : params.calendarId;

  const { fetchUser } = useCalendar();
  const { getIdToken, logout } = useAuth();
  const apiClient = useMemo(() => createApiClient(getIdToken), [getIdToken]);
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!calendarId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    apiClient.get<Calendar>(`calendars/${calendarId}`)
      .then(cal =>
        Promise.all((cal.memberIds ?? []).map(id => fetchUser(id)))
      )
      .then(results => {
        if (!cancelled) setMembers(results.filter((u): u is User => !!u));
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AuthError) {
          Alert.alert('Session Expired', 'Please log in again.', [
            { text: 'OK', onPress: () => logout() },
          ]);
        } else {
          Alert.alert('Error', 'Could not load members.');
          setMembers([]);
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [calendarId, apiClient, fetchUser]);

  const renderMember = ({ item }: { item: User }) => (
    <Pressable
      style={[styles.memberItem, { backgroundColor: surfaceColor, borderColor }]}
      onPress={() => router.push({ pathname: '/friend-profile', params: { userId: item.id } })}
    >
      <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
        <ThemedText style={[styles.avatarText, { color: tintColor }]}>
          {(item.name || '?').charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.memberInfo}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        {item.username && (
          <ThemedText style={[styles.username, { color: textSecondary }]}>
            @{item.username}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Members{!isLoading ? ` (${members.length})` : ''}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.2" size={48} color={textSecondary} />
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No members found
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
