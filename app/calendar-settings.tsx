import { StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { calendarColors } from '@/constants/theme';
import { CalendarType } from '@/types';
import { contacts } from '@/data/mock-data';

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const calendarId = params.id as string;

  const { calendars } = useCalendar();
  const calendar = calendars.find(cal => cal.id === calendarId);

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  const [name, setName] = useState(calendar?.name || '');
  const [description, setDescription] = useState(calendar?.description || '');
  const [selectedColor, setSelectedColor] = useState(calendar?.color || calendarColors[0]);
  const [calendarType, setCalendarType] = useState<CalendarType>(calendar?.type || 'personal');
  const [memberIds, setMemberIds] = useState<string[]>(calendar?.memberIds || []);

  if (!calendar) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Calendar not found</ThemedText>
      </ThemedView>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }

    // In real app, this would update via API
    Alert.alert(
      'Success',
      'Calendar settings updated!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Calendar',
      `Are you sure you want to delete "${calendar.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In real app, this would delete via API
            Alert.alert('Deleted', 'Calendar deleted', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleAddMembers = () => {
    router.push({
      pathname: '/user-search',
      params: { mode: 'calendar', calendarId },
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (userId === calendar.ownerId) {
      Alert.alert('Cannot Remove', 'You cannot remove the calendar owner');
      return;
    }
    setMemberIds(memberIds.filter(id => id !== userId));
  };

  return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Calendar Settings
        </ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Name */}
        <FormField label="Name" required>
          <FormTextInput
            value={name}
            onChangeText={setName}
            placeholder="Calendar name"
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <FormTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a description"
            multiline
          />
        </FormField>

        {/* Color */}
        <FormField label="Color">
          <View style={styles.colorGrid}>
            {calendarColors.map(color => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </View>
        </FormField>

        {/* Type */}
        <FormField label="Type">
          <View style={styles.typeButtons}>
            <Pressable
              style={[
                styles.typeButton,
                { borderColor },
                calendarType === 'personal' && { backgroundColor: tintColor, borderColor: tintColor },
              ]}
              onPress={() => setCalendarType('personal')}
            >
              <ThemedText
                style={[
                  styles.typeButtonText,
                  calendarType === 'personal' && styles.typeButtonTextActive,
                ]}
              >
                Personal
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                { borderColor },
                calendarType === 'shared' && { backgroundColor: tintColor, borderColor: tintColor },
              ]}
              onPress={() => setCalendarType('shared')}
            >
              <ThemedText
                style={[
                  styles.typeButtonText,
                  calendarType === 'shared' && styles.typeButtonTextActive,
                ]}
              >
                Shared
              </ThemedText>
            </Pressable>
          </View>
        </FormField>

        {/* Members (only for shared calendars) */}
        {calendarType === 'shared' && (
          <FormField label="Members">
            <Pressable
              style={[styles.addMembersButton, { backgroundColor: surfaceColor, borderColor }]}
              onPress={handleAddMembers}
            >
              <IconSymbol name="person.2" size={20} color={tintColor} />
              <ThemedText style={styles.addMembersText}>
                Add Members
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={tintColor} />
            </Pressable>

            {/* Member List */}
            {memberIds.length > 0 && (
              <View style={styles.membersList}>
                {memberIds.map(userId => {
                  const user = contacts.find(c => c.id === userId);
                  const isOwner = userId === calendar.ownerId;
                  if (!user) return null;

                  return (
                    <View
                      key={userId}
                      style={[styles.memberItem, { backgroundColor: surfaceColor, borderColor }]}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: tintColor + '20' }]}>
                        <ThemedText style={[styles.memberAvatarText, { color: tintColor }]}>
                          {user.name.charAt(0)}
                        </ThemedText>
                      </View>
                      <View style={styles.memberInfo}>
                        <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
                        <ThemedText style={[styles.memberEmail, { color: textSecondary }]}>
                          {isOwner ? 'Owner' : user.email}
                        </ThemedText>
                      </View>
                      {!isOwner && (
                        <Pressable onPress={() => handleRemoveMember(userId)} hitSlop={8}>
                          <IconSymbol name="xmark" size={20} color={dangerColor} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </FormField>
        )}

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, { backgroundColor: tintColor }]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>

        {/* Delete Button */}
        <Pressable
          style={[styles.deleteButton, { borderColor: dangerColor }]}
          onPress={handleDelete}
        >
          <ThemedText style={[styles.deleteButtonText, { color: dangerColor }]}>
            Delete Calendar
          </ThemedText>
        </Pressable>
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  addMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  addMembersText: {
    flex: 1,
    fontSize: 16,
  },
  membersList: {
    marginTop: 12,
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  saveButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 16,
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
});
