import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useState } from 'react';

import { AiInputBar } from '@/components/ai-input-bar';
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
  const [chipValue, setChipValue] = useState('');
  const [chipKey, setChipKey] = useState(0);

  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const borderColor = useThemeColor({}, 'border');

  const handleChipPress = (s: string) => {
    setChipValue(s);
    setChipKey((k) => k + 1);
  };

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
                onPress={() => handleChipPress(s)}
              >
                <ThemedText style={[styles.chipText, { color: textSecondary }]}>{s}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <AiInputBar key={chipKey} initialValue={chipValue} />
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
});
