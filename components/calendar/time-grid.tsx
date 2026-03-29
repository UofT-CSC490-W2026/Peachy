import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventBlock } from './event-block';
import { Calendar, CalendarEvent } from '@/types';
import { getEventTopOffset, getEventHeight } from '@/utils/date-helpers';

function getEffectiveEventRange(event: CalendarEvent, columnDate?: Date) {
  const rawStart = new Date(event.startTime);
  const rawEnd = new Date(event.endTime);

  if (!columnDate) {
    return { start: rawStart, end: rawEnd };
  }

  const dayStart = new Date(columnDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const clampedStart = rawStart < dayStart ? dayStart : rawStart;
  const clampedEnd = rawEnd > dayEnd ? dayEnd : rawEnd;

  if (clampedEnd <= clampedStart) {
    const minEnd = new Date(clampedStart.getTime() + 1);
    return { start: clampedStart, end: minEnd };
  }

  return { start: clampedStart, end: clampedEnd };
}

function computeEventLayout(
  events: CalendarEvent[],
  columnDate?: Date,
): Record<string, { left: number; width: number }> {
  if (!events.length) return {};

  const normalized = events
    .map((event) => {
      const { start, end } = getEffectiveEventRange(event, columnDate);
      return {
        event,
        startMs: start.getTime(),
        endMs: end.getTime(),
      };
    })
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const groups: typeof normalized[] = [];
  let currentGroup: typeof normalized = [];
  let currentGroupEnd = -Infinity;

  for (const item of normalized) {
    if (!currentGroup.length || item.startMs < currentGroupEnd) {
      currentGroup.push(item);
      currentGroupEnd = Math.max(currentGroupEnd, item.endMs);
    } else {
      groups.push(currentGroup);
      currentGroup = [item];
      currentGroupEnd = item.endMs;
    }
  }

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  const layout: Record<string, { left: number; width: number }> = {};

  for (const group of groups) {
    const colEnds: number[] = [];
    const eventCol: Record<string, number> = {};

    for (const item of group) {
      let col = colEnds.findIndex((endMs) => endMs <= item.startMs);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.endMs);
      } else {
        colEnds[col] = item.endMs;
      }
      eventCol[item.event.id] = col;
    }

    const totalCols = Math.max(1, colEnds.length);
    for (const item of group) {
      layout[item.event.id] = {
        left: (eventCol[item.event.id] / totalCols) * 100,
        width: 100 / totalCols,
      };
    }
  }

  return layout;
}

interface TimeGridProps {
  events: CalendarEvent[];
  calendars: Calendar[];
  columns?: number; // 1 for day view, 7 for week view
  getColumnEvents?: (columnIndex: number) => CalendarEvent[];
  getColumnDate?: (columnIndex: number) => Date;
}

export function TimeGrid({ events, calendars, columns = 1, getColumnEvents, getColumnDate }: TimeGridProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'borderLight');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderEvent = (event: CalendarEvent, layout?: { left: number; width: number }, columnDate?: Date) => {
    const { start: effectiveStart, end: effectiveEnd } = getEffectiveEventRange(event, columnDate);
    const top = getEventTopOffset(effectiveStart);
    const height = getEventHeight(effectiveStart, effectiveEnd);
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
            const columnDate = getColumnDate ? getColumnDate(columnIndex) : undefined;
            const layout = computeEventLayout(columnEvents, columnDate);

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
                {columnEvents.map(event => renderEvent(event, layout[event.id], getColumnDate ? getColumnDate(columnIndex) : undefined))}
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
