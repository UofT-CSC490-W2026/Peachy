import { useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EventBlock } from './event-block';
import { Calendar, CalendarEvent } from '@/types';
import {
  getWeekDates,
  getEventsForDay,
  getDayName,
  isSameDay,
  getEventTopOffset,
  getEventHeight,
} from '@/utils/date-helpers';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  scrollToDateToken?: number;
}

function getStartIndexForDay(dayIndex: number, visibleColumns: number, totalDays: number) {
  const maxStartIndex = Math.max(0, totalDays - visibleColumns);
  return Math.max(0, Math.min(maxStartIndex, dayIndex - 1));
}

function getEffectiveEventRange(event: CalendarEvent, date: Date) {
  const rawStart = new Date(event.startTime);
  const rawEnd = new Date(event.endTime);

  const dayStart = new Date(date);
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

function computeDayEventLayout(events: CalendarEvent[], date: Date): Record<string, { left: number; width: number }> {
  if (!events.length) return {};

  const normalized = events
    .map((event) => {
      const { start, end } = getEffectiveEventRange(event, date);
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

export function WeekView({ currentDate, events, calendars, scrollToDateToken }: WeekViewProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'borderLight');
  const { width: screenWidth } = useWindowDimensions();
  const horizontalScrollRef = useRef<ScrollView>(null);
  const lastScrollToken = useRef<number | undefined>(scrollToDateToken);

  const weekDates = getWeekDates(currentDate);
  const today = new Date();

  const visibleColumns = 3;
  const timeColumnWidth = 60;
  const availableWidth = Math.max(1, screenWidth - 16 - timeColumnWidth);
  const dayColumnWidth = availableWidth / visibleColumns;
  const totalColumnsWidth = dayColumnWidth * weekDates.length;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const currentIndex = Math.max(0, weekDates.findIndex((d) => isSameDay(d, currentDate)));
  const initialStartIndex = getStartIndexForDay(currentIndex, visibleColumns, weekDates.length);
  const initialOffsetX = initialStartIndex * dayColumnWidth;

  useEffect(() => {
    if (scrollToDateToken === undefined || lastScrollToken.current === scrollToDateToken) {
      return;
    }

    lastScrollToken.current = scrollToDateToken;
    const targetStartIndex = getStartIndexForDay(currentIndex, visibleColumns, weekDates.length);

    horizontalScrollRef.current?.scrollTo({
      x: targetStartIndex * dayColumnWidth,
      y: 0,
      animated: true,
    });
  }, [scrollToDateToken, currentIndex, visibleColumns, weekDates.length, dayColumnWidth]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.verticalScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.gridRow}>
          <View style={[styles.timeColumn, { width: timeColumnWidth }]}>
            <View style={[styles.timeHeaderSpacer, { borderBottomColor: borderColor }]} />
            {hours.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <ThemedText style={styles.timeLabel} lightColor={textSecondary} darkColor={textSecondary}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </ThemedText>
              </View>
            ))}
          </View>

          <ScrollView
            ref={horizontalScrollRef}
            key={`${weekDates[0].toDateString()}-${initialStartIndex}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="normal"
            contentOffset={{ x: initialOffsetX, y: 0 }}
          >
            <View style={[styles.daysCanvas, { width: totalColumnsWidth }]}>
              <View style={[styles.daysHeader, { borderBottomColor: borderColor }]}>
                {weekDates.map((date, index) => {
                  const isToday = isSameDay(date, today);
                  return (
                    <View key={index} style={[styles.dayHeader, { width: dayColumnWidth }]}>
                      <ThemedText style={styles.dayName} lightColor={textSecondary} darkColor={textSecondary}>
                        {getDayName(date.getDay())}
                      </ThemedText>
                      <View style={[styles.dayNumber, isToday && { backgroundColor: tintColor }]}>
                        <ThemedText
                          style={styles.dayNumberText}
                          lightColor={isToday ? '#FFFFFF' : undefined}
                          darkColor={isToday ? '#FFFFFF' : undefined}
                        >
                          {date.getDate()}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.columnsRow}>
                {weekDates.map((date, index) => {
                  const dayEvents = getEventsForDay(events, date);
                  const layout = computeDayEventLayout(dayEvents, date);

                  return (
                    <View key={index} style={[styles.dayColumn, { width: dayColumnWidth }]}>
                      {hours.map((hour) => (
                        <View key={hour} style={[styles.hourSlot, { borderColor }]} />
                      ))}

                      {dayEvents.map((event) => {
                        const { start, end } = getEffectiveEventRange(event, date);
                        const top = getEventTopOffset(start);
                        const height = getEventHeight(start, end);
                        const calColor = calendars.find((calendar) => calendar.id === event.calendarId)?.color ?? '#FF8C6B';

                        return (
                          <EventBlock
                            key={event.id}
                            event={event}
                            color={calColor}
                            top={top}
                            height={height}
                            left={layout[event.id]?.left}
                            width={layout[event.id]?.width}
                            onPress={() => {}}
                          />
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  timeColumn: {
    paddingTop: 0,
  },
  timeHeaderSpacer: {
    height: 49,
    borderBottomWidth: 1,
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
  daysCanvas: {
    flexDirection: 'column',
  },
  daysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 49,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dayName: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    includeFontPadding: false,
    paddingBottom: 2,
  },
  dayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  columnsRow: {
    flexDirection: 'row',
  },
  dayColumn: {
    position: 'relative',
  },
  hourSlot: {
    height: 60,
    borderTopWidth: 1,
  },
});
