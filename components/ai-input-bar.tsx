import { StyleSheet, View, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export function AiInputBar() {
  const [inputText, setInputText] = useState('');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const handleSend = () => {
    if (inputText.trim()) {
      Alert.alert('AI Scheduling', 'AI scheduling coming soon!', [{ text: 'OK' }]);
      setInputText('');
    }
  };

  const handleMic = () => {
    Alert.alert('Voice Input', 'Voice input coming soon!', [{ text: 'OK' }]);
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
      <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor }]}>
        <Pressable onPress={handleMic} style={styles.micButton}>
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
        />
        {inputText.trim().length > 0 && (
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: tintColor }]}>
            <IconSymbol name="arrow.up.circle.fill" size={28} color="#FFFFFF" />
          </Pressable>
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
});
