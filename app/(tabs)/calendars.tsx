import { StyleSheet, View, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
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
  const { calendars, visibleEvents, toggleCalendarVisibility, refreshCalendars, isLoading } = useCalendar();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await refreshCalendars(); } finally { setIsRefreshing(false); }
  }, [refreshCalendars]);
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
  const [weekScrollToken, setWeekScrollToken] = useState(0);

  const handlePrevPeriod = () => {
    if (currentView === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
      return;
    }

    if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    if (currentView === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
      return;
    }

    if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);

    if (currentView === 'week') {
      setWeekScrollToken(prev => prev + 1);
    }
  };

  const isManageView = tabView === 'manage';
  const headerDate = currentView === 'day' ? selectedDate : currentDate;

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
      <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor: surfaceColor }]}>
        <View style={styles.headerTitleRow}>
          <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
            Calendars
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          {!isManageView && (
            <Pressable
              style={[
                styles.topFilterButton,
                {
                  borderColor: tintColor,
                  backgroundColor: isFilterExpanded ? `${tintColor}20` : surfaceColor,
                },
              ]}
              onPress={() => setIsFilterExpanded(prev => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Toggle calendar filters"
            >
              <IconSymbol
                name="line.horizontal.3"
                size={18}
                color={tintColor}
              />
            </Pressable>
          )}
          <Pressable
            style={[
              styles.manageButton,
              { borderColor: tintColor, backgroundColor: isManageView ? `${tintColor}20` : surfaceColor },
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
            style={[styles.addButton, { backgroundColor: tintColor, borderColor: tintColor }]}
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
              currentDate={headerDate}
              onPrevMonth={handlePrevPeriod}
              onNextMonth={handleNextPeriod}
              onToday={handleToday}
              currentView={currentView}
              onViewChange={setCurrentView}
            />
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
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={tintColor} />
                }
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
              <WeekView
                currentDate={currentDate}
                events={visibleEvents}
                calendars={calendars}
                scrollToDateToken={weekScrollToken}
              />
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
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  topFilterButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeader: {
    paddingBottom: 4,
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
