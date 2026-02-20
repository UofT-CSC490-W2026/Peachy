import { StyleSheet, View } from 'react-native';
import { TimeGrid } from './time-grid';
import { Calendar, CalendarEvent } from '@/types';
import { getEventsForDay } from '@/utils/date-helpers';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
}

export function DayView({ currentDate, events, calendars }: DayViewProps) {
  const dayEvents = getEventsForDay(events, currentDate);

  return (
    <View style={styles.container}>
      <TimeGrid events={dayEvents} calendars={calendars} columns={1} getColumnDate={() => currentDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
