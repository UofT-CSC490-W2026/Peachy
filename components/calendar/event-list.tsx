import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventCard } from './event-card';
import { CalendarEvent } from '@/types';
import { getCalendarColor } from '@/utils/calendar-helpers';

interface EventListProps {
  events: CalendarEvent[];
  selectedDate: Date;
}

export function EventList({ events, selectedDate }: EventListProps) {
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
          calendarColor={getCalendarColor(item.calendarId)}
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
