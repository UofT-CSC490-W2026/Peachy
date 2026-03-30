import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MonthDayCell } from './month-day-cell';
import { MonthDayPreview } from './month-day-preview';
import { Calendar, CalendarEvent } from '@/types';
import { getMonthGrid, getEventsForDay, isSameDay } from '@/utils/date-helpers';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendars: Calendar[];
}

export function MonthView({ currentDate, events, selectedDate, onSelectDate, calendars }: MonthViewProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  const monthGrid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
  const selectedDayEvents = getEventsForDay(events, selectedDate);
  const today = new Date();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Day names header */}
      <View style={styles.weekHeader}>
        {dayNames.map(day => (
          <View key={day} style={styles.dayNameCell}>
            <ThemedText
              style={styles.dayName}
              lightColor={textSecondary}
              darkColor={textSecondary}
            >
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {monthGrid.map((date, index) => {
          const dayEvents = getEventsForDay(events, date);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <MonthDayCell
              key={index}
              date={date}
              currentMonth={currentDate.getMonth()}
              events={dayEvents}
              isSelected={isSelected}
              isToday={isToday}
              onPress={() => onSelectDate(date)}
              calendars={calendars}
            />
          );
        })}
      </View>

      <MonthDayPreview
        selectedDate={selectedDate}
        events={selectedDayEvents}
        calendars={calendars}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayNameCell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
});
