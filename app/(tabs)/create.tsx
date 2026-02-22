import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

const SUGGESTIONS = [
  'Dinner with Jordan tomorrow at 7pm',
  'Weekly team standup every Monday 9am',
  'Birthday party for Sarah next Saturday',
  'Dentist appointment Friday at 2pm',
];

export default function CreateScreen() {
  const [input, setInput] = useState('');

  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: tintColor }]}>
            <IconSymbol name="sparkles" size={22} color="#fff" />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
              Peachy AI
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: textSecondary }]}>
              Your scheduling assistant
            </ThemedText>
          </View>
        </View>

        {/* Chat scroll area */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI greeting bubble */}
          <View style={styles.messageRow}>
            <View style={[styles.avatarSmall, { backgroundColor: tintColor }]}>
              <IconSymbol name="sparkles" size={12} color="#fff" />
            </View>
            <View style={[styles.aiBubble, { backgroundColor: surfaceSecondary }]}>
              <ThemedText style={styles.bubbleText}>
                Hi! I'm Peachy AI. Tell me what you'd like to schedule and I'll take care of it for you.
              </ThemedText>
            </View>
          </View>

          {/* Suggestion chips */}
          <ThemedText style={[styles.suggestionsLabel, { color: textSecondary }]}>
            Try asking...
          </ThemedText>
          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, { borderColor, backgroundColor: surfaceColor }]}
                onPress={() => setInput(s)}
              >
                <ThemedText style={[styles.chipText, { color: textSecondary }]}>{s}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputWrap, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
          <View style={[styles.inputRow, { borderColor }]}>
            <Pressable style={styles.micBtn}>
              <IconSymbol name="mic.fill" size={20} color={iconColor} />
            </Pressable>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Ask Peachy AI..."
              placeholderTextColor={iconColor}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
            />
            {input.trim().length > 0 && (
              <Pressable style={[styles.sendBtn, { backgroundColor: tintColor }]}>
                <IconSymbol name="arrow.up.circle.fill" size={28} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 2,
  },
  chips: {
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 14,
  },
  inputWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  micBtn: {
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
    maxHeight: 100,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
