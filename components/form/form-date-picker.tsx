import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FormDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function FormDatePicker({ date }: FormDatePickerProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  // Simplified date display - full native picker integration TBD
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderColor,
        },
      ]}
    >
      <ThemedText style={styles.text}>
        {formattedDate} at {formattedTime}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
  },
});
