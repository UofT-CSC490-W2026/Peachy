import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { mockAIParse } from '@/utils/ai-parser';

export function AiInputBar() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Parse input with AI (mock for now)
      const parsed = mockAIParse(trimmedInput);

      // Navigate to create event screen with pre-filled data
      router.push({
        pathname: '/event-create',
        params: {
          aiGenerated: 'true',
          aiInput: trimmedInput,
          title: parsed.extractedData.title || '',
          startTime: parsed.extractedData.startTime || '',
          endTime: parsed.extractedData.endTime || '',
          isAllDay: parsed.extractedData.isAllDay ? 'true' : 'false',
          location: parsed.extractedData.location || '',
          inviteeIds: parsed.extractedData.invitedUserIds?.join(',') || '',
        },
      });

      setInputText('');
    } catch (error) {
      Alert.alert('Error', 'Could not understand your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMic = () => {
    Alert.alert('Voice Input', 'Voice input coming soon! For now, try typing:\n\n• "dinner with Jordan tomorrow at 7pm"\n• "meeting with Taylor next Monday 2pm"\n• "lunch Friday at noon"', [{ text: 'OK' }]);
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
      <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor }]}>
        <Pressable onPress={handleMic} style={styles.micButton} disabled={isLoading}>
          <IconSymbol name="mic.fill" size={20} color={iconColor} />
        </Pressable>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Schedule with AI..."
          placeholderTextColor={iconColor}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
          editable={!isLoading}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={tintColor} style={styles.loader} />
        ) : (
          inputText.trim().length > 0 && (
            <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: tintColor }]}>
              <IconSymbol name="arrow.up.circle.fill" size={28} color="#FFFFFF" />
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  micButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  loader: {
    marginLeft: 4,
  },
});
