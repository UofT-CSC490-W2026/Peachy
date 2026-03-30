import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CalendarChipProps {
  name: string;
  color: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function CalendarChip({ name, color, isVisible, onToggle }: CalendarChipProps) {
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.chip,
        {
          backgroundColor: isVisible ? color + '20' : surfaceColor,
          borderColor: isVisible ? color : borderColor,
        },
      ]}
    >
      <ThemedText
        style={[styles.chipText, !isVisible && styles.chipTextDisabled]}
        lightColor={isVisible ? color : '#687076'}
        darkColor={isVisible ? color : '#9BA1A6'}
      >
        <ThemedText style={[styles.dot, { color }]}>● </ThemedText>
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextDisabled: {
    opacity: 0.5,
  },
  dot: {
    fontSize: 12,
  },
});
