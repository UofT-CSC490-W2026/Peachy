import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Calendar, CalendarEvent } from '@/types';

interface MonthDayCellProps {
  date: Date;
  currentMonth: number;
  events: CalendarEvent[];
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  calendars: Calendar[];
}

export function MonthDayCell({
  date,
  currentMonth,
  events,
  isSelected,
  isToday,
  onPress,
  calendars,
}: MonthDayCellProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'borderLight');

  const isCurrentMonth = date.getMonth() === currentMonth;
  const dayNumber = date.getDate();

  // Get unique calendar colors for this day's events
  const eventColors = [...new Set(events.map(e => e.calendarId))].slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        { borderColor },
        isSelected && { backgroundColor: tintColor + '10' },
      ]}
    >
      <View style={styles.dayNumberContainer}>
        {isToday ? (
          <View style={[styles.todayCircle, { backgroundColor: tintColor }]}>
            <ThemedText style={styles.todayNumber} lightColor="#FFFFFF" darkColor="#FFFFFF">
              {dayNumber}
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            style={styles.dayNumber}
            lightColor={isCurrentMonth ? undefined : textSecondary}
            darkColor={isCurrentMonth ? undefined : textSecondary}
          >
            {dayNumber}
          </ThemedText>
        )}
      </View>
      {eventColors.length > 0 && (
        <View style={styles.eventDots}>
          {eventColors.map((calendarId) => {
            const color = calendars.find(c => c.id === calendarId)?.color ?? '#FF8C6B';

            return (
              <View
                key={calendarId}
                style={[styles.eventDot, { backgroundColor: color }]}
              />
            );
          })}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    borderWidth: 0.5,
    padding: 4,
    alignItems: 'center',
  },
  dayNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
