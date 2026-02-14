import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { User, CalendarEvent } from '@/types';
import { contacts, mockEvents } from '@/data/mock-data';

interface AvailabilityViewerProps {
  invitedUserIds: string[];
  proposedStartTime: Date;
  proposedEndTime: Date;
}

interface UserAvailability {
  user: User;
  isAvailable: boolean;
  conflictingEvents: CalendarEvent[];
}

export function AvailabilityViewer({
  invitedUserIds,
  proposedStartTime,
  proposedEndTime,
}: AvailabilityViewerProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  // Check availability for each user
  const checkUserAvailability = (userId: string): UserAvailability => {
    const user = contacts.find(u => u.id === userId);
    if (!user) {
      return {
        user: { id: userId, name: 'Unknown', email: '', createdAt: '' },
        isAvailable: true,
        conflictingEvents: [],
      };
    }

    // Find events where this user is invited
    const userEvents = mockEvents.filter(event =>
      event.invitedUserIds.includes(userId) || event.createdBy === userId
    );

    // Check for conflicts
    const conflicts = userEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check if proposed time overlaps with existing event
      return (
        (proposedStartTime >= eventStart && proposedStartTime < eventEnd) ||
        (proposedEndTime > eventStart && proposedEndTime <= eventEnd) ||
        (proposedStartTime <= eventStart && proposedEndTime >= eventEnd)
      );
    });

    return {
      user,
      isAvailable: conflicts.length === 0,
      conflictingEvents: conflicts,
    };
  };

  const availabilities = invitedUserIds.map(checkUserAvailability);
  const availableCount = availabilities.filter(a => a.isAvailable).length;
  const totalCount = availabilities.length;

  if (invitedUserIds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
          Add people to check availability
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <ThemedText style={styles.summaryText}>
          {availableCount === totalCount ? (
            <ThemedText style={{ color: successColor }}>
              ✓ All {totalCount} invitee{totalCount !== 1 ? 's' : ''} available
            </ThemedText>
          ) : (
            <ThemedText>
              <ThemedText style={{ color: successColor }}>{availableCount} available</ThemedText>
              {' • '}
              <ThemedText style={{ color: dangerColor }}>
                {totalCount - availableCount} busy
              </ThemedText>
            </ThemedText>
          )}
        </ThemedText>
      </View>

      {/* User List */}
      <ScrollView style={styles.userList} contentContainerStyle={styles.userListContent}>
        {availabilities.map(({ user, isAvailable, conflictingEvents }) => (
          <View
            key={user.id}
            style={[
              styles.userItem,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <View style={styles.userHeader}>
              <View style={[styles.avatar, { backgroundColor: isAvailable ? successColor + '20' : dangerColor + '20' }]}>
                <ThemedText style={[styles.avatarText, { color: isAvailable ? successColor : dangerColor }]}>
                  {user.name.charAt(0)}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
                <ThemedText style={[styles.statusText, { color: isAvailable ? successColor : dangerColor }]}>
                  {isAvailable ? 'Available' : `${conflictingEvents.length} conflict${conflictingEvents.length !== 1 ? 's' : ''}`}
                </ThemedText>
              </View>
            </View>

            {/* Show conflicts */}
            {!isAvailable && conflictingEvents.length > 0 && (
              <View style={styles.conflicts}>
                {conflictingEvents.map(event => {
                  const startTime = new Date(event.startTime);
                  const endTime = new Date(event.endTime);
                  const timeStr = event.isAllDay
                    ? 'All day'
                    : `${startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

                  return (
                    <View key={event.id} style={styles.conflictItem}>
                      <ThemedText style={[styles.conflictTitle, { color: textSecondary }]} numberOfLines={1}>
                        • {event.title}
                      </ThemedText>
                      <ThemedText style={[styles.conflictTime, { color: textSecondary }]}>
                        {timeStr}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  summary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    padding: 16,
    paddingTop: 0,
  },
  userItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  conflicts: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  conflictItem: {
    marginBottom: 6,
  },
  conflictTitle: {
    fontSize: 13,
  },
  conflictTime: {
    fontSize: 12,
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
