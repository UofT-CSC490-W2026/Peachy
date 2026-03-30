import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventCard } from './event-card';
import { Calendar, CalendarEvent } from '@/types';

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date;
  calendars: Calendar[];
}

export function EventList({ events, selectedDate, calendars }: EventListProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText
          style={styles.emptyText}
          lightColor={textSecondary}
          darkColor={textSecondary}
        >
          No events for this day
        </ThemedText>
      </View>
    );
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <View style={styles.list}>
      {sortedEvents.map((item) => (
        <EventCard
          key={item.id}
          event={item}
          calendarColor={calendars.find(c => c.id === item.calendarId)?.color ?? '#FF8C6B'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
