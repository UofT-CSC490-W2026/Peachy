import { StyleSheet, ScrollView } from 'react-native';
import { CalendarChip } from './calendar-chip';
import { Calendar } from '@/types';

interface CalendarFilterBarProps {
  calendars: Calendar[];
  onToggle: (calendarId: string) => void;
}

export function CalendarFilterBar({ calendars, onToggle }: CalendarFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {calendars.map(calendar => (
        <CalendarChip
          key={calendar.id}
          name={calendar.name}
          color={calendar.color}
          isVisible={calendar.isVisible}
          onToggle={() => onToggle(calendar.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});
