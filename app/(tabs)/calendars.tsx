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
import { CalendarFilterBar } from '@/components/calendar/calendar-filter-bar';
import { MonthView } from '@/components/calendar/month-view';
import { WeekView } from '@/components/calendar/week-view';
import { DayView } from '@/components/calendar/day-view';

type TabView = 'calendar' | 'manage';
type CalendarView = 'day' | 'week' | 'month';

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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

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

  const visibleCalendarCount = calendars.filter(calendar => calendar.isVisible).length;
  const isManageView = tabView === 'manage';

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
        <View style={styles.headerTitleRow}>
          <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
            Calendars
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.manageButton,
              { borderColor: tintColor, backgroundColor: isManageView ? `${tintColor}20` : 'transparent' },
            ]}
            onPress={() => {
              if (!isManageView) {
                setIsFilterExpanded(false);
              }
              setTabView(isManageView ? 'calendar' : 'manage');
            }}
          >
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              {isManageView ? 'Calendar' : 'Manage'}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/calendar-create')}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
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
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <Pressable
              style={[styles.filterPill, { borderColor, backgroundColor: surfaceColor }]}
              onPress={() => setIsFilterExpanded(prev => !prev)}
            >
              <ThemedText
                style={styles.filterPillText}
                lightColor={textSecondary}
                darkColor={textSecondary}
              >
                Filters ({visibleCalendarCount}/{calendars.length})
              </ThemedText>
              <IconSymbol
                name={isFilterExpanded ? 'chevron.up' : 'chevron.down'}
                size={14}
                color={textSecondary}
              />
            </Pressable>
            {isFilterExpanded && (
              <CalendarFilterBar
                calendars={calendars}
                onToggle={toggleCalendarVisibility}
              />
            )}
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
                  calendars={calendars}
                />
              </ScrollView>
            )}
            {currentView === 'week' && (
              <WeekView currentDate={currentDate} events={visibleEvents} calendars={calendars} />
            )}
            {currentView === 'day' && (
              <DayView currentDate={selectedDate} events={visibleEvents} calendars={calendars} />
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
    paddingBottom: 10,
  },
  headerTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeader: {
    paddingBottom: 4,
  },
  filterPill: {
    marginHorizontal: 20,
    marginTop: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
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
