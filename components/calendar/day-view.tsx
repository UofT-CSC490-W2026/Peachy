import { StyleSheet, View } from 'react-native';
import { TimeGrid } from './time-grid';
import { CalendarEvent } from '@/types';
import { getEventsForDay } from '@/utils/date-helpers';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
}

export function DayView({ currentDate, events }: DayViewProps) {
  const dayEvents = getEventsForDay(events, currentDate);

  return (
    <View style={styles.container}>
      <TimeGrid events={dayEvents} columns={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
