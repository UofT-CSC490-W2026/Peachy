import { StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { contacts, currentUser } from '@/data/mock-data';

export default function EventEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.id as string;

  const { calendars, events } = useCalendar();
  const event = events.find(e => e.id === eventId);
  const isOwner = event && event.createdBy === currentUser.id;

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const [title, setTitle] = useState(event?.title || '');
  const [selectedCalendar] = useState(event ? calendars.find(c => c.id === event.calendarId) || calendars[0] : calendars[0]);
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [startDate, setStartDate] = useState(event ? new Date(event.startTime) : new Date());
  const [endDate, setEndDate] = useState(event ? new Date(event.endTime) : new Date());
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>(event?.invitedUserIds || []);

  // Handle return from user search
  useEffect(() => {
    if (params.selectedUsers) {
      const userIds = JSON.parse(params.selectedUsers as string);
      setInvitedUserIds(userIds);
    }
  }, [params.selectedUsers]);

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Event not found</ThemedText>
      </ThemedView>
    );
  }

  if (!isOwner) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Only the event owner can edit this event.
          </ThemedText>
          <Pressable
            style={[styles.backHomeButton, { backgroundColor: tintColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backHomeButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    // In real app, this would update via API
    Alert.alert('Success', 'Event updated!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Edit Event
        </ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <FormField label="Title" required>
          <FormTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
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
                params: { mode: 'event', returnPath: '/event-edit', eventId },
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
              Save Changes
            </ThemedText>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
