import { StyleSheet, View, FlatList, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { Calendar } from '@/types';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { ViewSwitcher, CalendarView } from '@/components/calendar/view-switcher';
import { CalendarFilterBar } from '@/components/calendar/calendar-filter-bar';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';
import { EventList } from '@/components/calendar/event-list';
import { getEventsForDay } from '@/utils/date-helpers';

type TabView = 'calendar' | 'manage';

export default function CalendarsScreen() {
  const { calendars, visibleEvents, toggleCalendarVisibility } = useCalendar();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [tabView, setTabView] = useState<TabView>('calendar');
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const selectedDayEvents = getEventsForDay(visibleEvents, selectedDate);

  const renderCalendar = ({ item }: { item: Calendar }) => (
    <Pressable
      style={[styles.calendarItem, { backgroundColor: surfaceColor, borderColor }]}
      onPress={() => {
        router.push({
          pathname: '/calendar-settings',
          params: { id: item.id },
        });
      }}
    >
      <View style={styles.calendarInfo}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.calendarText}>
          <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
          <ThemedText lightColor="#687076" darkColor="#9BA1A6" style={styles.calendarType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.memberIds.length} member{item.memberIds.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Calendars</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/calendar-create')}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentedControl, { backgroundColor: surfaceColor }]}>
        <Pressable
          style={[
            styles.segmentButton,
            tabView === 'calendar' && { backgroundColor: tintColor },
          ]}
          onPress={() => setTabView('calendar')}
        >
          <ThemedText
            style={[
              styles.segmentText,
              tabView === 'calendar' && styles.segmentTextActive,
            ]}
          >
            Calendar
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.segmentButton,
            tabView === 'manage' && { backgroundColor: tintColor },
          ]}
          onPress={() => setTabView('manage')}
        >
          <ThemedText
            style={[
              styles.segmentText,
              tabView === 'manage' && styles.segmentTextActive,
            ]}
          >
            Manage
          </ThemedText>
        </Pressable>
      </View>

      {/* Calendar View */}
      {tabView === 'calendar' && (
        <>
          <View style={styles.calendarHeader}>
            <CalendarHeader
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />
            <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
            <CalendarFilterBar
              calendars={calendars}
              onToggle={toggleCalendarVisibility}
            />
          </View>

          <View style={styles.content}>
            {currentView === 'month' && (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                <MonthView
                  currentDate={currentDate}
                  events={visibleEvents}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <EventList events={selectedDayEvents} selectedDate={selectedDate} />
              </ScrollView>
            )}
            {currentView === 'week' && (
              <WeekView currentDate={currentDate} events={visibleEvents} />
            )}
            {currentView === 'day' && (
              <DayView currentDate={selectedDate} events={visibleEvents} />
            )}
          </View>
        </>
      )}

      {/* Manage View */}
      {tabView === 'manage' && (
        <FlatList
          data={calendars}
          renderItem={renderCalendar}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 4,
    borderRadius: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  calendarHeader: {
    paddingBottom: 8,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  list: {
    padding: 20,
  },
  calendarItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  calendarText: {
    flex: 1,
  },
  calendarType: {
    fontSize: 14,
    marginTop: 4,
  },
});
