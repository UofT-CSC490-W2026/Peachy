import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { User, CalendarEvent } from '@/types';
import { contacts, mockEvents } from '@/data/mock-data';

interface AvailabilityViewerProps {
  invitedUserIds: string[];
  proposedStartTime: Date;
  proposedEndTime: Date;
  excludeEventId?: string; // When editing, exclude this event from conflicts
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
  excludeEventId,
}: AvailabilityViewerProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

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
    const userEvents = mockEvents.filter(event => {
      // Exclude the current event when editing (don't count itself as conflict)
      if (excludeEventId && event.id === excludeEventId) {
        return false;
      }
      return event.invitedUserIds.includes(userId) || event.createdBy === userId;
    });

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
        {availabilities.map(({ user, isAvailable, conflictingEvents }) => {
          const isExpanded = expandedUserId === user.id;
          const hasConflicts = !isAvailable && conflictingEvents.length > 0;

          return (
            <View
              key={user.id}
              style={[
                styles.userItem,
                {
                  backgroundColor: surfaceColor,
                  borderColor: isAvailable ? successColor + '40' : dangerColor + '40',
                  borderWidth: 2,
                },
              ]}
            >
              <Pressable
                style={styles.userHeader}
                onPress={() => hasConflicts && setExpandedUserId(isExpanded ? null : user.id)}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: isAvailable ? successColor + '20' : dangerColor + '20' }]}>
                  <ThemedText style={[styles.avatarText, { color: isAvailable ? successColor : dangerColor }]}>
                    {user.name.charAt(0)}
                  </ThemedText>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
                  <View style={styles.statusRow}>
                    <IconSymbol
                      name={isAvailable ? 'checkmark.circle.fill' : 'xmark'}
                      size={16}
                      color={isAvailable ? successColor : dangerColor}
                    />
                    <ThemedText style={[styles.statusText, { color: isAvailable ? successColor : dangerColor }]}>
                      {isAvailable ? 'Available' : `${conflictingEvents.length} conflict${conflictingEvents.length !== 1 ? 's' : ''}`}
                    </ThemedText>
                  </View>
                </View>

                {/* Expand Icon */}
                {hasConflicts && (
                  <IconSymbol
                    name={isExpanded ? 'chevron.up' : 'chevron.down'}
                    size={20}
                    color={textSecondary}
                  />
                )}
              </Pressable>

              {/* Collapsible Conflicts */}
              {hasConflicts && isExpanded && (
                <View style={[styles.conflicts, { borderTopColor: borderColor }]}>
                  <ThemedText style={[styles.conflictsHeader, { color: textSecondary }]}>
                    Conflicting Events:
                  </ThemedText>
                  {conflictingEvents.map(event => {
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    const timeStr = event.isAllDay
                      ? 'All day'
                      : `${startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

                    return (
                      <View key={event.id} style={styles.conflictItem}>
                        <View style={styles.conflictHeader}>
                          <IconSymbol name="clock" size={14} color={dangerColor} />
                          <ThemedText
                            style={[styles.conflictTitle, { color: textSecondary }]}
                            numberOfLines={1}
                          >
                            {event.title}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.conflictTime, { color: textSecondary }]}>
                          {timeStr}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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
    padding: 12,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  conflicts: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  conflictsHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  conflictItem: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  conflictTitle: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  conflictTime: {
    fontSize: 12,
    marginLeft: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
