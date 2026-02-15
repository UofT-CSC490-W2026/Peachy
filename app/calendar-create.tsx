import { StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { calendarColors } from '@/constants/theme';
import { CalendarType } from '@/types';

export default function CalendarCreateScreen() {
  const router = useRouter();
  const { addCalendar } = useCalendar();
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(calendarColors[0]);
  const [selectedType, setSelectedType] = useState<CalendarType>('personal');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }

    const newCalendar = {
      id: `cal-${Date.now()}`,
      name: name.trim(),
      color: selectedColor,
      type: selectedType,
      description: description.trim() || undefined,
      ownerId: 'user-1',
      memberIds: ['user-1'],
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCalendar(newCalendar);
    Alert.alert('Success', 'Calendar created!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <FormField label="Name" required>
          <FormTextInput
            value={name}
            onChangeText={setName}
            placeholder="Calendar name"
            autoFocus
          />
        </FormField>

        <FormField label="Color">
          <View style={styles.colorPicker}>
            {calendarColors.map(color => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && {
                    borderWidth: 3,
                    borderColor: tintColor,
                  },
                ]}
              />
            ))}
          </View>
        </FormField>

        <FormField label="Type">
          <View style={styles.typeButtons}>
            {(['personal', 'shared'] as CalendarType[]).map(type => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeButton,
                  { borderColor },
                  selectedType === type && { backgroundColor: tintColor },
                ]}
              >
                <ThemedText
                  style={styles.typeButtonText}
                  lightColor={selectedType === type ? '#FFFFFF' : undefined}
                  darkColor={selectedType === type ? '#FFFFFF' : undefined}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="Description">
          <FormTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add description"
            multiline
          />
        </FormField>

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
              Create Calendar
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});
