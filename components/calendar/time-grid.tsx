import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventBlock } from './event-block';
import { Calendar, CalendarEvent } from '@/types';
import { getEventTopOffset, getEventHeight } from '@/utils/date-helpers';

function computeEventLayout(
  events: CalendarEvent[]
): Record<string, { left: number; width: number }> {
  if (!events.length) return {};
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const eventCol: Record<string, number> = {};
  const colEnds: number[] = [];

  for (const ev of sorted) {
    const start = new Date(ev.startTime).getTime();
    const end = new Date(ev.endTime).getTime();
    let col = colEnds.findIndex(e => e <= start);
    if (col === -1) { col = colEnds.length; colEnds.push(end); }
    else { colEnds[col] = Math.max(colEnds[col], end); }
    eventCol[ev.id] = col;
  }

  const total = colEnds.length;
  return Object.fromEntries(
    events.map(ev => [
      ev.id,
      { left: (eventCol[ev.id] / total) * 100, width: 100 / total },
    ])
  );
}

interface TimeGridProps {
  events: CalendarEvent[];
  calendars: Calendar[];
  columns?: number; // 1 for day view, 7 for week view
  getColumnEvents?: (columnIndex: number) => CalendarEvent[];
}

export function TimeGrid({ events, calendars, columns = 1, getColumnEvents }: TimeGridProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'borderLight');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderEvent = (event: CalendarEvent, layout?: { left: number; width: number }) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const top = getEventTopOffset(startTime);
    const height = getEventHeight(startTime, endTime);
    const cal = calendars.find(c => c.id === event.calendarId);
    const color = cal?.color ?? '#FF8C6B';

    return (
      <EventBlock
        key={event.id}
        event={event}
        color={color}
        top={top}
        height={height}
        left={layout?.left}
        width={layout?.width}
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
            const layout = computeEventLayout(columnEvents);

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
                {columnEvents.map(event => renderEvent(event, layout[event.id]))}
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
