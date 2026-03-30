import { StyleSheet, View, Pressable, ScrollView, Alert, RefreshControl } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { useAuth } from '@/contexts/auth-context';
import { useFriends } from '@/contexts/friends-context';
import { UpcomingEvents } from '@/components/calendar/upcoming-events';
import { PendingItems } from '@/components/pending-items';

export default function HomeScreen() {
  const router = useRouter();
  const { calendars, visibleEvents, pendingItems, acceptPendingItem, declinePendingItem, refreshCalendars, refreshPendingItems } = useCalendar();
  const { user } = useAuth();
  const { refreshFriends } = useFriends();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const ownedCalendars = useMemo(
    () => calendars.filter(c => c.ownerId === user?.id),
    [calendars, user?.id]
  );
  const canCreateEvent = ownedCalendars.length > 0;

  // All items fetched are already 'pending' status — no need to filter
  const displayedPendingItems = useMemo(() => pendingItems, [pendingItems]);

  const handleAccept = async (itemId: string, calendarId?: string) => {
    const item = pendingItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      await acceptPendingItem(itemId, item.sk, calendarId);
      if (item.type === 'friend_request') {
        refreshFriends();
      }
    } catch {
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshCalendars(), refreshPendingItems()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCalendars, refreshPendingItems]);

  const handleDecline = async (itemId: string) => {
    const item = pendingItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      await declinePendingItem(itemId, (item as any).sk);
    } catch {
      Alert.alert('Error', 'Failed to decline invitation. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Simple header */}
      <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor: surfaceColor }]}>
        <ThemedText type="title">Home</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: tintColor, borderColor: tintColor, opacity: canCreateEvent ? 1 : 0.5 }]}
          onPress={() => {
            if (!canCreateEvent) {
              Alert.alert('No Owned Calendars', 'Create or own a calendar before creating events.');
              return;
            }
            router.push('/event-create');
          }}
          disabled={!canCreateEvent}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={tintColor} />
        }
      >
        {/* Pending items */}
        <PendingItems
          items={displayedPendingItems}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />

        {/* Upcoming events timeline */}
        <UpcomingEvents events={visibleEvents} calendars={calendars} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
