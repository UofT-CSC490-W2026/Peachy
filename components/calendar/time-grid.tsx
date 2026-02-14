import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventBlock } from './event-block';
import { CalendarEvent } from '@/types';
import { getEventTopOffset, getEventHeight } from '@/utils/date-helpers';
import { getCalendarColor } from '@/utils/calendar-helpers';

interface TimeGridProps {
  events: CalendarEvent[];
  columns?: number; // 1 for day view, 7 for week view
  getColumnEvents?: (columnIndex: number) => CalendarEvent[];
}

export function TimeGrid({ events, columns = 1, getColumnEvents }: TimeGridProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'borderLight');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderEvent = (event: CalendarEvent, columnIndex: number = 0) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const top = getEventTopOffset(startTime);
    const height = getEventHeight(startTime, endTime);
    const color = getCalendarColor(event.calendarId);

    return (
      <EventBlock
        key={event.id}
        event={event}
        color={color}
        top={top}
        height={height}
        onPress={() => {
          router.push({
            pathname: '/event-detail',
            params: { id: event.id },
          });
        }}
      />
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.gridContainer}>
        {/* Time labels */}
        <View style={styles.timeColumn}>
          {hours.map(hour => (
            <View key={hour} style={styles.timeSlot}>
              <ThemedText
                style={styles.timeLabel}
                lightColor={textSecondary}
                darkColor={textSecondary}
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Event columns */}
        <View style={styles.columnsContainer}>
          {Array.from({ length: columns }, (_, columnIndex) => {
            const columnEvents = getColumnEvents ? getColumnEvents(columnIndex) : events;

            return (
              <View
                key={columnIndex}
                style={[
                  styles.column,
                  { width: `${100 / columns}%` },
                ]}
              >
                {hours.map(hour => (
                  <View
                    key={hour}
                    style={[styles.hourSlot, { borderColor }]}
                  />
                ))}
                {columnEvents.map(event => renderEvent(event, columnIndex))}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
    paddingTop: 0,
  },
  timeSlot: {
    height: 60,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  timeLabel: {
    fontSize: 11,
    textAlign: 'right',
    paddingRight: 8,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    position: 'relative',
  },
  hourSlot: {
    height: 60,
    borderTopWidth: 1,
  },
});
