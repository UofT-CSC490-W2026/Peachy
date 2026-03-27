import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { PendingItem } from '@/types';
import { formatTime } from '@/utils/date-helpers';

interface PendingItemsProps {
  items: PendingItem[];
  onAccept: (itemId: string) => void;
  onDecline: (itemId: string) => void;
}

export function PendingItems({ items, onAccept, onDecline }: PendingItemsProps) {
  const router = useRouter();
  const { events, calendars, getUser } = useCalendar();
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const dangerColor = useThemeColor({}, 'danger');

  if (items.length === 0) {
    return null;
  }

  const handleViewEventDetail = (item: PendingItem) => {
    if (item.type === 'event_invite' && item.eventId) {
      router.push({
        pathname: '/event-detail',
        params: { id: item.eventId, calendarId: item.calendarId },
      });
    }
  };

  const getIcon = (type: PendingItem['type']) => {
    switch (type) {
      case 'calendar_invite':
        return 'calendar';
      case 'event_invite':
        return 'bell';
      case 'event_update':
        return 'bell';
      case 'friend_request':
        return 'person.2';
      default:
        return 'bell';
    }
  };

  // Helper to get display info from referenced entities
  const getDisplayInfo = (item: PendingItem) => {
    if (item.type === 'event_invite' && item.eventId) {
      const event = events.find(e => e.id === item.eventId);
      if (event) {
        const eventDate = new Date(event.startTime);
        const timeStr = event.isAllDay ? 'All day' : formatTime(eventDate);
        const dateStr = eventDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        return {
          title: 'Event Invitation',
          description: `${event.title} • ${dateStr} at ${timeStr}`,
        };
      }
    } else if (item.type === 'calendar_invite' && item.calendarId) {
      const calendar = calendars.find(c => c.id === item.calendarId);
      const sender = getUser(item.fromUserId);
      if (calendar && sender) {
        return {
          title: 'Calendar Invitation',
          description: `${sender.name} invited you to join "${calendar.name}" calendar`,
        };
      }
    } else if (item.type === 'event_update' && item.eventId) {
      const event = events.find(e => e.id === item.eventId);
      if (event) {
        return {
          title: 'Event Updated',
          description: `"${event.title}" has been updated`,
        };
      }
    }

    if (item.type === 'friend_request') {
      const sender = getUser(item.fromUserId);
      return {
        title: 'Friend Request',
        description: sender ? `${sender.name} wants to be friends` : 'Someone wants to be friends',
      };
    }

    return {
      title: 'Invitation',
      description: 'Tap to view details',
    };
  };

  const handleAccept = (item: PendingItem) => {
    const { title } = getDisplayInfo(item);
    Alert.alert(
      'Accept',
      `Accept "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => onAccept(item.id) },
      ]
    );
  };

  const handleDecline = (item: PendingItem) => {
    const { title } = getDisplayInfo(item);
    Alert.alert(
      'Decline',
      `Decline "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => onDecline(item.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
        PENDING
      </ThemedText>
      {items.map(item => {
        const isEventInvite = item.type === 'event_invite';
        const HeaderWrapper = isEventInvite ? Pressable : View;
        const { title, description } = getDisplayInfo(item);

        return (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}
          >
            <HeaderWrapper
              style={styles.header}
              onPress={isEventInvite ? () => handleViewEventDetail(item) : undefined}
            >
              <View style={styles.iconContainer}>
                <IconSymbol
                  name={getIcon(item.type)}
                  size={20}
                  color={tintColor}
                />
              </View>
              <View style={styles.content}>
                <ThemedText type="defaultSemiBold" style={styles.title}>
                  {title}
                  {isEventInvite && (
                    <ThemedText style={[styles.viewDetail, { color: tintColor }]}>
                      {' '}• Tap to view
                    </ThemedText>
                  )}
                </ThemedText>
                <ThemedText
                  style={[styles.description, { color: textSecondary }]}
                  numberOfLines={2}
                >
                  {description}
                </ThemedText>
              </View>
            </HeaderWrapper>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.declineButton, { borderColor: dangerColor }]}
              onPress={() => handleDecline(item)}
            >
              <ThemedText style={[styles.buttonText, { color: dangerColor }]}>
                Decline
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.acceptButton, { backgroundColor: tintColor }]}
              onPress={() => handleAccept(item)}
            >
              <ThemedText style={[styles.buttonText, styles.acceptButtonText]}>
                Accept
              </ThemedText>
            </Pressable>
          </View>
        </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 140, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  viewDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {
    // backgroundColor set via tintColor
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#FFFFFF',
  },
});
