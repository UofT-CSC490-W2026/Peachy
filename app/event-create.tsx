import { StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
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
import { contacts } from '@/data/mock-data';

export default function EventCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { calendars, addEvent } = useCalendar();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [title, setTitle] = useState('');
  const [selectedCalendar] = useState(calendars[0]);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  });
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);

  // Handle return from user search
  useEffect(() => {
    if (params.selectedUsers) {
      const userIds = JSON.parse(params.selectedUsers as string);
      setInvitedUserIds(userIds);
    }
  }, [params.selectedUsers]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const newEvent = {
      id: `event-${Date.now()}`,
      calendarId: selectedCalendar.id,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      isAllDay,
      timezone: 'America/Los_Angeles',
      status: 'confirmed' as const,
      reminders: [],
      invitedUserIds,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addEvent(newEvent);
    Alert.alert('Success', 'Event created!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
            label={selectedCalendar.name}
            value={selectedCalendar.type}
            onPress={() => {
              Alert.alert('Calendar Picker', 'Full calendar picker coming soon!');
            }}
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
          <FormDatePicker date={startDate} onDateChange={setStartDate} />
        </FormField>

        <FormField label="End Time">
          <FormDatePicker date={endDate} onDateChange={setEndDate} />
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
                const user = contacts.find(c => c.id === userId);
                if (!user) return null;
                return (
                  <View key={userId} style={[styles.inviteeChip, { backgroundColor: surfaceColor, borderColor }]}>
                    <ThemedText style={styles.inviteeChipText}>{user.name}</ThemedText>
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
            style={[styles.button, styles.saveButton, { backgroundColor: tintColor }]}
          >
            <ThemedText style={styles.saveButtonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Create Event
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
    </>
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
});
