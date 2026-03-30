import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTheme, type ThemePreference, type TextSize } from '@/contexts/theme-context';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function SegmentedControl<T extends string>({ options, selected, onSelect }: SegmentedControlProps<T>) {
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={[styles.segmentedControl, { borderColor, backgroundColor: surfaceColor }]}>
      {options.map((opt, i) => {
        const isSelected = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segment,
              isSelected && { backgroundColor: tintColor },
              i < options.length - 1 && { borderRightWidth: 1, borderRightColor: borderColor },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <ThemedText
              style={[styles.segmentLabel, { color: isSelected ? '#fff' : textSecondary }]}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppearanceScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const { themePreference, setThemePreference, textSize, setTextSize } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={textColor} />
        </Pressable>
        <ThemedText style={styles.title}>Appearance</ThemedText>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
        {/* Theme */}
        <ThemedText style={[styles.label, { color: textSecondary }]}>THEME</ThemedText>
        <SegmentedControl<ThemePreference>
          options={[
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
            { value: 'dark', label: 'Dark' },
          ]}
          selected={themePreference}
          onSelect={setThemePreference}
        />

        {/* Text Size */}
        <ThemedText style={[styles.label, { color: textSecondary, marginTop: 28 }]}>TEXT SIZE</ThemedText>
        <SegmentedControl<TextSize>
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Default' },
            { value: 'large', label: 'Large' },
          ]}
          selected={textSize}
          onSelect={setTextSize}
        />
        <ThemedText style={[styles.preview, { color: textSecondary }]}>
          The quick brown fox jumps over the lazy dog.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  topBarSpacer: { width: 40 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  preview: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
