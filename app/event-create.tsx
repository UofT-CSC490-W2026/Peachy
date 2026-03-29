import { StyleSheet, ScrollView, View, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { FormSwitchRow } from '@/components/form/form-switch-row';
import { FormPickerRow } from '@/components/form/form-picker-row';
import { FormDatePicker } from '@/components/form/form-date-picker';
import { AvailabilityViewer } from '@/components/availability-viewer';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { useAuth } from '@/contexts/auth-context';
import { AuthError } from '@/utils/api-client';
import { getSlotIndex } from '@/utils/rl-helpers';
export default function EventCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { calendars, createEvent, getUser, fetchUser } = useCalendar();
  const { user, getIdToken, logout } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  // Check if AI-generated
  const isAIGenerated = params.aiGenerated === 'true';
  const aiInput = params.aiInput as string | undefined;

  // Pre-fill from AI params or start empty
  const [title, setTitle] = useState(params.title as string || '');
  const [selectedCalendar, setSelectedCalendar] = useState(calendars[0] ?? null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [isAllDay, setIsAllDay] = useState(params.isAllDay === 'true');
  const [startDate, setStartDate] = useState(() => {
    if (params.startTime) {
      const parsed = new Date(params.startTime as string);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [endDate, setEndDate] = useState(() => {
    if (params.endTime) {
      const parsed = new Date(params.endTime as string);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  });
  const [location, setLocation] = useState(params.location as string || '');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inviteeDisplayNames, setInviteeDisplayNames] = useState<Record<string, string>>({});
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>(() => {
    if (params.inviteeIds) {
      const ids = (params.inviteeIds as string).split(',').filter(id => id.trim());
      return ids;
    }
    return [];
  });

  // Track original AI values for detecting edits
  const [aiOriginalValues] = useState(() => ({
    title: params.title as string || '',
    startTime: params.startTime as string || '',
    endTime: params.endTime as string || '',
    location: params.location as string || '',
    isAllDay: params.isAllDay === 'true',
    inviteeIds: params.inviteeIds as string || '',
  }));

  // Set default calendar once calendars load (handles async context initialization)
  useEffect(() => {
    if (!selectedCalendar && calendars.length > 0) {
      setSelectedCalendar(calendars[0]);
    }
  }, [calendars, selectedCalendar]);

  // Fetch display names for invitees not already in the user cache
  useEffect(() => {
    invitedUserIds.forEach(uid => {
      if (!getUser(uid)) {
        fetchUser(uid).then(u => {
          if (u) setInviteeDisplayNames(prev => ({ ...prev, [uid]: u.name }));
        });
      }
    });
  }, [invitedUserIds, fetchUser, getUser]);

  // Handle return from user search
  useEffect(() => {
    if (params.selectedUsers) {
      try {
        const parsed: unknown = JSON.parse(params.selectedUsers as string);
        if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
          setInvitedUserIds(parsed);
        }
      } catch {
        // Ignore malformed param — keep current invitee list
      }
    }
  }, [params.selectedUsers]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!selectedCalendar) {
      Alert.alert('Error', 'Please select a calendar');
      return;
    }
    if (!isAllDay && endDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }
    if (isAllDay && endDate < startDate) {
      Alert.alert('Invalid Date', 'End date must be on or after start date');
      return;
    }

    // Track which fields were edited (if AI-generated)
    const aiEditedFields: string[] = [];
    if (isAIGenerated) {
      if (title.trim() !== aiOriginalValues.title) aiEditedFields.push('title');
      if (startDate.getTime() !== new Date(aiOriginalValues.startTime).getTime()) aiEditedFields.push('startTime');
      if (endDate.getTime() !== new Date(aiOriginalValues.endTime).getTime()) aiEditedFields.push('endTime');
      if (location.trim() !== aiOriginalValues.location) aiEditedFields.push('location');
      if (isAllDay !== aiOriginalValues.isAllDay) aiEditedFields.push('isAllDay');
      if (invitedUserIds.join(',') !== aiOriginalValues.inviteeIds) aiEditedFields.push('invitedUserIds');
    }

    // Parse aiSuggested param (JSON-stringified full AI parse response for RL tracking)
    const aiSuggested = params.aiSuggested
      ? (() => { try { return JSON.parse(params.aiSuggested as string) as object; } catch { return undefined; } })()
      : undefined;

    setIsSaving(true);
    try {
      await createEvent(selectedCalendar.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        isAllDay,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        invitedUserIds,
        ...(isAIGenerated && {
          aiGenerated: true,
          aiInput,
          aiSuggested,
          aiEditedFields: aiEditedFields.length > 0 ? aiEditedFields : undefined,
        }),
      });

      // Fire-and-forget RL feedback for AI-generated events
      if (isAIGenerated && user) {
        const token = await getIdToken();
        if (token) {
          const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
          const apiUrl = (extra.apiUrl ?? '').replace(/\/$/, '');
          const aiOriginalStartTime = aiOriginalValues.startTime
            ? new Date(aiOriginalValues.startTime)
            : startDate;
          const suggestedSlotIndex = getSlotIndex(aiOriginalStartTime);
          const action = aiEditedFields.includes('startTime') ? 'move' : 'accept';
          const body: Record<string, unknown> = { suggestedSlotIndex, action };
          if (action === 'move') {
            body.movedToSlotIndex = getSlotIndex(startDate);
          }
          fetch(`${apiUrl}/users/${encodeURIComponent(user.id)}/rl/feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }).catch(() => {}); // fire-and-forget
        }
      }

      router.back();
    } catch (err) {
      if (err instanceof AuthError) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          { text: 'OK', onPress: logout },
        ]);
        return;
      }
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* AI Badge */}
        {isAIGenerated && aiInput && (
          <View style={[styles.aiBadge, { backgroundColor: tintColor + '15', borderColor: tintColor + '30' }]}>
            <IconSymbol name="sparkles" size={16} color={tintColor} />
            <View style={styles.aiBadgeContent}>
              <ThemedText style={[styles.aiBadgeTitle, { color: tintColor }]}>AI suggested</ThemedText>
              <ThemedText style={styles.aiBadgeInput}>&quot;{aiInput}&quot;</ThemedText>
            </View>
          </View>
        )}

        <FormField label="Title" required>
          <FormTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            autoFocus
          />
        </FormField>

        <FormField label="Calendar">
          <FormPickerRow
            label={selectedCalendar?.name ?? 'Select Calendar'}
            value={selectedCalendar?.type ?? ''}
            onPress={() => setShowCalendarPicker(true)}
          />
        </FormField>

        <FormField label="All Day">
          <FormSwitchRow
            label="All day event"
            value={isAllDay}
            onValueChange={setIsAllDay}
          />
        </FormField>

        <FormField label="Start Time">
          <FormDatePicker date={startDate} onDateChange={setStartDate} isAllDay={isAllDay} />
        </FormField>

        <FormField label="End Time">
          <FormDatePicker date={endDate} onDateChange={setEndDate} isAllDay={isAllDay} />
        </FormField>

        <FormField label="Location">
          <FormTextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Add location"
          />
        </FormField>

        <FormField label="Description">
          <FormTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add description"
            multiline
          />
        </FormField>

        {/* Invitees Section */}
        <FormField label="Invitees">
          <Pressable
            style={[styles.addPeopleButton, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => {
              router.push({
                pathname: '/user-search',
                params: { mode: 'event', returnPath: '/event-create' },
              });
            }}
          >
            <IconSymbol name="person.2" size={20} color={tintColor} />
            <ThemedText style={styles.addPeopleText}>
              {invitedUserIds.length === 0
                ? 'Add people'
                : `${invitedUserIds.length} invitee${invitedUserIds.length !== 1 ? 's' : ''}`}
            </ThemedText>
            <IconSymbol name="chevron.right" size={16} color={tintColor} />
          </Pressable>

          {/* Show invited users */}
          {invitedUserIds.length > 0 && (
            <View style={styles.inviteesList}>
              {invitedUserIds.map(userId => {
                const displayName = getUser(userId)?.name ?? inviteeDisplayNames[userId] ?? userId;
                return (
                  <View key={userId} style={[styles.inviteeChip, { backgroundColor: surfaceColor, borderColor }]}>
                    <ThemedText style={styles.inviteeChipText}>{displayName}</ThemedText>
                    <Pressable
                      onPress={() => setInvitedUserIds(invitedUserIds.filter(id => id !== userId))}
                      hitSlop={8}
                    >
                      <IconSymbol name="xmark" size={14} color={tintColor} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </FormField>

        {/* Availability Checker */}
        {invitedUserIds.length > 0 && (
          <FormField label="Availability">
            <AvailabilityViewer
              invitedUserIds={invitedUserIds}
              proposedStartTime={startDate}
              proposedEndTime={endDate}
            />
          </FormField>
        )}

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.button, styles.cancelButton]}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.button, styles.saveButton, { backgroundColor: tintColor, opacity: isSaving ? 0.7 : 1 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                Create Event
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showCalendarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCalendarPicker(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Select Calendar</ThemedText>
              <Pressable onPress={() => setShowCalendarPicker(false)}>
                <IconSymbol name="xmark" size={24} color={tintColor} />
              </Pressable>
            </View>
            <ScrollView style={styles.calendarList}>
              {calendars.map((calendar) => (
                <Pressable
                  key={calendar.id}
                  style={[
                    styles.calendarItem,
                    { borderBottomColor: borderColor },
                  ]}
                  onPress={() => {
                    setSelectedCalendar(calendar);
                    setShowCalendarPicker(false);
                  }}
                >
                  <View style={styles.calendarInfo}>
                    <View
                      style={[
                        styles.calendarColorDot,
                        { backgroundColor: calendar.color },
                      ]}
                    />
                    <View style={styles.calendarText}>
                      <ThemedText type="defaultSemiBold">{calendar.name}</ThemedText>
                      <ThemedText style={styles.calendarType}>
                        {calendar.type === 'personal' ? 'Personal' : 'Shared'}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedCalendar?.id === calendar.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={tintColor} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    //
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addPeopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  addPeopleText: {
    flex: 1,
    fontSize: 16,
  },
  inviteesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  inviteeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  inviteeChipText: {
    fontSize: 14,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  aiBadgeContent: {
    flex: 1,
  },
  aiBadgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  aiBadgeInput: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  // Calendar Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  calendarList: {
    maxHeight: 400,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
  },
  calendarType: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
});
