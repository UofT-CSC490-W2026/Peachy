import { View } from 'react-native';

// This screen is a placeholder — the create button opens the AI input sheet
// in _layout.tsx instead of navigating here. Render nothing to avoid a flash.
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
                {"Hi! I'm Peachy AI. Tell me what you'd like to schedule and I'll take care of it for you."}
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
