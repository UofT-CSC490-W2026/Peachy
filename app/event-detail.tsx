import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { useAuth } from '@/contexts/auth-context';
import { AuthError } from '@/utils/api-client';
import { formatDateRange } from '@/utils/date-helpers';
import type { CalendarEvent } from '@/types';

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.id as string;

  const { calendars, events, deleteEvent, getUser } = useCalendar();
  const { logout, user, getIdToken } = useAuth();

  const localEvent = events.find(e => e.id === eventId);
  const [fetchedEvent, setFetchedEvent] = useState<CalendarEvent | null>(null);
  // Start in loading state immediately if we'll need to fetch (avoids "Event not found" flash)
  const [isFetching, setIsFetching] = useState(!localEvent && !!eventId);

  // If not in local state (e.g. pending invite not yet accepted), fetch from API
  useEffect(() => {
    if (localEvent || !eventId) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    getIdToken().then(token => {
      if (!token) throw new Error('No token');
      const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
      const apiUrl = (extra.apiUrl ?? '').replace(/\/$/, '');
      // Use the invite-specific endpoint — no calendarId required
      return fetch(`${apiUrl}/pending-items/event/${encodeURIComponent(eventId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }).then(res => {
      if (!res || !res.ok) return undefined;
      return res.json();
    }).then((data: CalendarEvent | undefined) => {
      if (data) setFetchedEvent(data);
    }).catch(() => {
      // silently fall through to "not found" state
    }).finally(() => setIsFetching(false));
  }, [eventId, localEvent, getIdToken]);

  const event = localEvent ?? fetchedEvent;
  const calendar = event ? calendars.find(c => c.id === event.calendarId) : null;
  const isOwner = event && user && event.createdBy === user.id;

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  if (isFetching) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.back()} style={styles.backButtonAbsolute}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText>Event not found</ThemedText>
      </ThemedView>
    );
  }

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const timeRange = formatDateRange(startTime, endTime, event.isAllDay);

  const handleEdit = () => {
    router.push({
      pathname: '/event-edit',
      params: { id: event.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            router.back();
            deleteEvent(event.calendarId, event.id).catch(err => {
              if (err instanceof AuthError) {
                Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
                  { text: 'OK', onPress: logout },
                ]);
                return;
              }
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete event');
            });
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        {isOwner && (
          <View style={styles.headerActions}>
            <Pressable onPress={handleEdit} style={styles.headerButton}>
              <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>
                Edit
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* AI Attribution Badge */}
        {event.aiGenerated && event.aiInput && (
          <View style={[styles.aiBadge, { backgroundColor: tintColor + '10', borderColor: borderColor }]}>
            <IconSymbol name="sparkles" size={14} color={textSecondary} />
            <ThemedText style={[styles.aiText, { color: textSecondary }]}>
              Created from: &quot;{event.aiInput}&quot;
            </ThemedText>
          </View>
        )}

        {/* Title with calendar color */}
        <View style={styles.titleSection}>
          <View style={[styles.colorBar, { backgroundColor: calendar?.color ?? tintColor }]} />
          <View style={styles.titleContent}>
            <ThemedText type="title" style={styles.title}>
              {event.title}
            </ThemedText>
            {calendar ? (
              <ThemedText style={[styles.calendarName, { color: calendar.color }]}>
                {calendar.name}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.calendarName, { color: textSecondary }]}>
                Invitation (not yet accepted)
              </ThemedText>
            )}
          </View>
        </View>

        {/* Time */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionRow}>
            <IconSymbol name="clock" size={24} color={tintColor} />
            <View style={styles.sectionContent}>
              <ThemedText type="defaultSemiBold">
                {event.isAllDay ? 'All Day' : timeRange}
              </ThemedText>
              <ThemedText style={[styles.sectionSubtext, { color: textSecondary }]}>
                {startTime.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Location */}
        {event.location && (
          <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionRow}>
              <IconSymbol name="mappin" size={24} color={tintColor} />
              <View style={styles.sectionContent}>
                <ThemedText type="defaultSemiBold">Location</ThemedText>
                <ThemedText style={[styles.sectionSubtext, { color: textSecondary }]}>
                  {event.location}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Invitees */}
        {(event.invitedUserIds?.length ?? 0) > 0 && (
          <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionRow}>
              <IconSymbol name="person.2" size={24} color={tintColor} />
              <View style={styles.sectionContent}>
                <ThemedText type="defaultSemiBold">
                  Invitees ({event.invitedUserIds?.length ?? 0})
                </ThemedText>
                <View style={styles.inviteesList}>
                  {(event.invitedUserIds ?? []).map(inviteeId => {
                    const inviteeUser = getUser(inviteeId);
                    // Use RSVP status from the event itself (written by accept/decline handlers)
                    const status = event.inviteeStatuses?.[inviteeId] ?? 'pending';
                    const statusColor = status === 'accepted' ? '#22c55e' : status === 'declined' ? dangerColor : textSecondary;
                    const statusLabel = status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Pending';
                    return (
                      <View key={inviteeId} style={styles.inviteeRow}>
                        <View style={[styles.inviteeAvatar, { backgroundColor: tintColor + '20' }]}>
                          <ThemedText style={[styles.inviteeAvatarText, { color: tintColor }]}>
                            {inviteeUser ? inviteeUser.name.charAt(0) : '?'}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.inviteeName}>
                          {inviteeUser?.name ?? inviteeId}
                        </ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                          <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionRow}>
              <IconSymbol name="note.text" size={24} color={tintColor} />
              <View style={styles.sectionContent}>
                <ThemedText type="defaultSemiBold">Description</ThemedText>
                <ThemedText style={[styles.descriptionText, { color: textSecondary }]}>
                  {event.description}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Recurrence */}
        {event.recurrence && (
          <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionRow}>
              <IconSymbol name="repeat" size={24} color={tintColor} />
              <View style={styles.sectionContent}>
                <ThemedText type="defaultSemiBold">Repeats</ThemedText>
                <ThemedText style={[styles.sectionSubtext, { color: textSecondary }]}>
                  {event.recurrence.frequency.charAt(0).toUpperCase() + event.recurrence.frequency.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Reminders */}
        {event.reminders?.length > 0 && (
          <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionRow}>
              <IconSymbol name="bell" size={24} color={tintColor} />
              <View style={styles.sectionContent}>
                <ThemedText type="defaultSemiBold">Reminders</ThemedText>
                {event.reminders.map((reminder, index) => {
                  const minutes = reminder.minutes;
                  let timeStr = '';
                  if (minutes < 60) {
                    timeStr = `${minutes} minutes before`;
                  } else if (minutes < 1440) {
                    timeStr = `${minutes / 60} hours before`;
                  } else {
                    timeStr = `${minutes / 1440} days before`;
                  }
                  return (
                    <ThemedText key={index} style={[styles.sectionSubtext, { color: textSecondary }]}>
                      • {timeStr}
                    </ThemedText>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Delete Button - Only for owner */}
        {isOwner && (
          <Pressable
            style={[styles.deleteButton, { borderColor: dangerColor }]}
            onPress={handleDelete}
          >
            <ThemedText style={[styles.deleteButtonText, { color: dangerColor }]}>
              Delete Event
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 16,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionContent: {
    flex: 1,
    marginLeft: 16,
  },
  sectionSubtext: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 22,
  },
  inviteesList: {
    marginTop: 12,
    gap: 8,
  },
  inviteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteeName: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inviteeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteeAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22,
  },
  deleteButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 40,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  aiText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
});
