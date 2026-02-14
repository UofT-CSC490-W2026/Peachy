import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FormPickerRowProps {
  label: string;
  value: string;
  onPress: () => void;
}

export function FormPickerRow({ label, value, onPress }: FormPickerRowProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.value}>{value}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },
});
