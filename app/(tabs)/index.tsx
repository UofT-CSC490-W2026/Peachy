import { StyleSheet, View, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { UpcomingEvents } from '@/components/calendar/upcoming-events';
import { PendingItems } from '@/components/pending-items';
import { AiInputBar } from '@/components/ai-input-bar';

export default function HomeScreen() {
  const router = useRouter();
  const { calendars, visibleEvents, pendingItems, acceptEventInvite, declineEventInvite } = useCalendar();
  const tintColor = useThemeColor({}, 'tint');

  // Filter to show only pending items
  const displayedPendingItems = useMemo(() =>
    pendingItems.filter(item => item.status === 'pending'),
    [pendingItems]
  );

  const handleAccept = (itemId: string) => {
    const item = pendingItems.find(i => i.id === itemId);
    if (!item) return;

    // For event invites, use the synced accept function
    if (item.type === 'event_invite' && item.eventId) {
      acceptEventInvite(item.eventId);
      Alert.alert('Success', 'Event invitation accepted');
    } else {
      // For other types (calendar invites, etc.), handle separately
      Alert.alert('Success', 'Item accepted successfully');
    }
  };

  const handleDecline = (itemId: string) => {
    const item = pendingItems.find(i => i.id === itemId);
    if (!item) return;

    // For event invites, use the synced decline function
    if (item.type === 'event_invite' && item.eventId) {
      declineEventInvite(item.eventId);
      Alert.alert('Declined', 'Event invitation declined');
    } else {
      // For other types (calendar invites, etc.), handle separately
      Alert.alert('Declined', 'Item declined');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

        {/* AI Input Bar */}
        <AiInputBar />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
