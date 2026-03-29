import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CalendarEvent } from '@/types';
import { EventCard } from './event-card';
import {
  getEventsForToday,
  getEventsForTomorrow,
  getFutureEvents,
  formatDateSectionHeader,
} from '@/utils/date-helpers';

interface UpcomingEventsProps {
  events: CalendarEvent[];
  calendars: { id: string; color: string }[];
}

export function UpcomingEvents({ events, calendars }: UpcomingEventsProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Create calendar color mapping
  const calendarColors: Record<string, string> = {};
  calendars.forEach(cal => {
    calendarColors[cal.id] = cal.color;
  });

  // Group events
  const todayEvents = getEventsForToday(events);
  const tomorrowEvents = getEventsForTomorrow(events);
  const futureEvents = getFutureEvents(events);

  // Group future events by date
  const futureEventsByDate: Record<string, CalendarEvent[]> = {};
  futureEvents.forEach(event => {
    const dateKey = new Date(event.startTime).toDateString();
    if (!futureEventsByDate[dateKey]) {
      futureEventsByDate[dateKey] = [];
    }
    futureEventsByDate[dateKey].push(event);
  });

  const hasAnyEvents = todayEvents.length > 0 || tomorrowEvents.length > 0 || futureEvents.length > 0;

  if (!hasAnyEvents) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
          No upcoming events
        </ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: textSecondary }]}>
          Use the AI input below to schedule something
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Today */}
      {todayEvents.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            TODAY
          </ThemedText>
          {todayEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              calendarColor={calendarColors[event.calendarId] || '#FF8C6B'}
            />
          ))}
        </View>
      )}

      {/* Tomorrow */}
      {tomorrowEvents.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            TOMORROW
          </ThemedText>
          {tomorrowEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              calendarColor={calendarColors[event.calendarId] || '#FF8C6B'}
            />
          ))}
        </View>
      )}

      {/* Future events grouped by date */}
      {futureEvents.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
            UPCOMING
          </ThemedText>
          {Object.keys(futureEventsByDate).map(dateKey => (
            <View key={dateKey}>
              <ThemedText style={styles.dateSubheader}>
                {formatDateSectionHeader(new Date(dateKey))}
              </ThemedText>
              {futureEventsByDate[dateKey].map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  calendarColor={calendarColors[event.calendarId] || '#FF8C6B'}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  dateSubheader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
