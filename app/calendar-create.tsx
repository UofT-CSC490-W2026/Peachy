import { StyleSheet, ScrollView, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { useAuth } from '@/contexts/auth-context';
import { AuthError } from '@/utils/api-client';
import { calendarColors } from '@/constants/theme';
import { CalendarType } from '@/types';

export default function CalendarCreateScreen() {
  const router = useRouter();
  const { createCalendar } = useCalendar();
  const { logout } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(calendarColors[0]);
  const [selectedType, setSelectedType] = useState<CalendarType>('personal');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }

    setIsSaving(true);
    try {
      await createCalendar({
        name: name.trim(),
        color: selectedColor,
        type: selectedType,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (err) {
      if (err instanceof AuthError) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          { text: 'OK', onPress: logout },
        ]);
        return;
      }
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create calendar');
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
            style={[styles.button, styles.saveButton, { backgroundColor: tintColor, opacity: isSaving ? 0.7 : 1 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
                Create Calendar
              </ThemedText>
            )}
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
