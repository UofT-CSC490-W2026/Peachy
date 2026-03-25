import { StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { UpcomingEvents } from '@/components/calendar/upcoming-events';
import { PendingItems } from '@/components/pending-items';

export default function HomeScreen() {
  const router = useRouter();
  const { calendars, visibleEvents, pendingItems, acceptPendingItem, declinePendingItem } = useCalendar();
  const tintColor = useThemeColor({}, 'tint');

  // All items fetched are already 'pending' status — no need to filter
  const displayedPendingItems = useMemo(() => pendingItems, [pendingItems]);

  const handleAccept = async (itemId: string) => {
    try {
      await acceptPendingItem(itemId);
      Alert.alert('Success', 'Invitation accepted');
    } catch {
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    }
  };

  const handleDecline = async (itemId: string) => {
    try {
      await declinePendingItem(itemId);
      Alert.alert('Declined', 'Invitation declined');
    } catch {
      Alert.alert('Error', 'Failed to decline invitation. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Simple header */}
      <View style={styles.header}>
        <ThemedText type="title">Home</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/event-create')}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
    paddingBottom: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
