import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TimeGrid } from './time-grid';
import { Calendar, CalendarEvent } from '@/types';
import { getWeekDates, getEventsForDay, getDayName, isSameDay } from '@/utils/date-helpers';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
}

export function WeekView({ currentDate, events, calendars }: WeekViewProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const weekDates = getWeekDates(currentDate);
  const today = new Date();

  const getColumnEvents = (columnIndex: number) => {
    return getEventsForDay(events, weekDates[columnIndex]);
  };

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.header}>
        <View style={styles.timeColumnSpacer} />
        <View style={styles.daysHeader}>
          {weekDates.map((date, index) => {
            const isToday = isSameDay(date, today);
            return (
              <View key={index} style={styles.dayHeader}>
                <ThemedText
                  style={styles.dayName}
                  lightColor={textSecondary}
                  darkColor={textSecondary}
                >
                  {getDayName(date.getDay())}
                </ThemedText>
                <View
                  style={[
                    styles.dayNumber,
                    isToday && { backgroundColor: tintColor },
                  ]}
                >
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
      </View>

      {/* Time grid */}
      <TimeGrid events={events} calendars={calendars} columns={7} getColumnEvents={getColumnEvents} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 8,
    marginBottom: 8,
  },
  timeColumnSpacer: {
    width: 60,
  },
  daysHeader: {
    flex: 1,
    flexDirection: 'row',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
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
    fontWeight: '600',
  },
});
