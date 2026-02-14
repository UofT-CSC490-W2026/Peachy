import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMonthName } from '@/utils/date-helpers';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const monthName = getMonthName(currentDate.getMonth());
  const year = currentDate.getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <ThemedText type="title" style={styles.title}>
          {monthName} {year}
        </ThemedText>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={onPrevMonth} style={styles.iconButton}>
          <IconSymbol name="chevron.left" size={24} color={iconColor} />
        </Pressable>
        <Pressable
          onPress={onToday}
          style={[styles.todayButton, { borderColor: tintColor }]}
        >
          <ThemedText style={[styles.todayText, { color: tintColor }]}>Today</ThemedText>
        </Pressable>
        <Pressable onPress={onNextMonth} style={styles.iconButton}>
          <IconSymbol name="chevron.right" size={24} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
