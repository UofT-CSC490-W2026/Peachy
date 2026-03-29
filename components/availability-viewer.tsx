import { StyleSheet, View, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import type { CalendarEvent } from '@/types';

interface AvailabilityViewerProps {
  invitedUserIds: string[];
  proposedStartTime: Date;
  proposedEndTime: Date;
  excludeEventId?: string;
}

interface UserAvailability {
  userId: string;
  displayName: string;
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
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const { events, getUser, fetchUser } = useCalendar();

  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');
  const dangerColor = useThemeColor({}, 'danger');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  // Fetch names for any invitee not already in cache
  useEffect(() => {
    invitedUserIds.forEach(uid => {
      if (!getUser(uid) && !userNames[uid]) {
        fetchUser(uid).then(u => {
          if (u) setUserNames(prev => ({ ...prev, [uid]: u.name }));
        });
      }
    });
  }, [invitedUserIds, fetchUser, getUser, userNames]);

  const getDisplayName = (userId: string): string => {
    return getUser(userId)?.name ?? userNames[userId] ?? 'Loading…';
  };

  const checkUserAvailability = (userId: string): UserAvailability => {
    // Find all events that belong to this user (they created or have an accepted copy)
    const userEvents = events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      return event.createdBy === userId || (event.invitedUserIds ?? []).includes(userId);
    });

    const conflicts = userEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return (
        (proposedStartTime >= eventStart && proposedStartTime < eventEnd) ||
        (proposedEndTime > eventStart && proposedEndTime <= eventEnd) ||
        (proposedStartTime <= eventStart && proposedEndTime >= eventEnd)
      );
    });

    return {
      userId,
      displayName: getDisplayName(userId),
      isAvailable: conflicts.length === 0,
      conflictingEvents: conflicts,
    };
  };

  if (invitedUserIds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
          Add people to check availability
        </ThemedText>
      </View>
    );
  }

  const availabilities = invitedUserIds.map(checkUserAvailability);
  const availableCount = availabilities.filter(a => a.isAvailable).length;
  const totalCount = availabilities.length;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        {availableCount === totalCount ? (
          <ThemedText style={[styles.summaryText, { color: successColor }]}>
            ✓ All {totalCount} invitee{totalCount !== 1 ? 's' : ''} available
          </ThemedText>
        ) : (
          <ThemedText style={styles.summaryText}>
            <ThemedText style={{ color: successColor }}>{availableCount} available</ThemedText>
            <ThemedText style={{ color: textSecondary }}>{' • '}</ThemedText>
            <ThemedText style={{ color: dangerColor }}>{totalCount - availableCount} busy</ThemedText>
          </ThemedText>
        )}
      </View>

      {/* User List */}
      <View style={styles.userList}>
        {availabilities.map(({ userId, displayName, isAvailable, conflictingEvents }) => {
          const isExpanded = expandedUserId === userId;
          const hasConflicts = !isAvailable && conflictingEvents.length > 0;

          return (
            <View
              key={userId}
              style={[
                styles.userItem,
                {
                  backgroundColor: surfaceColor,
                  borderColor: isAvailable ? successColor + '40' : dangerColor + '40',
                },
              ]}
            >
              <Pressable
                style={styles.userHeader}
                onPress={() => hasConflicts && setExpandedUserId(isExpanded ? null : userId)}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: isAvailable ? successColor + '20' : dangerColor + '20' }]}>
                  <ThemedText style={[styles.avatarText, { color: isAvailable ? successColor : dangerColor }]}>
                    {displayName.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{displayName}</ThemedText>
                  <View style={styles.statusRow}>
                    <IconSymbol
                      name={isAvailable ? 'checkmark.circle.fill' : 'xmark'}
                      size={14}
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
                    size={16}
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
                      : `${startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

                    return (
                      <View key={event.id} style={styles.conflictItem}>
                        <View style={styles.conflictHeader}>
                          <IconSymbol name="clock" size={13} color={dangerColor} />
                          <ThemedText style={[styles.conflictTitle, { color: textSecondary }]} numberOfLines={1}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  summary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userList: {
    gap: 8,
  },
  userItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conflicts: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  conflictsHeader: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  conflictItem: {
    marginBottom: 6,
    paddingLeft: 2,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  conflictTitle: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  conflictTime: {
    fontSize: 11,
    marginLeft: 18,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
