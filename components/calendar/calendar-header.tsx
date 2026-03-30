import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMonthName, getWeekDates } from '@/utils/date-helpers';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  currentView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  currentView,
  onViewChange,
}: CalendarHeaderProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'borderLight');

  const monthName = getMonthName(currentDate.getMonth());
  const year = currentDate.getFullYear();
  const views: CalendarView[] = ['day', 'week', 'month'];
  const activeView = currentView ?? 'month';

  const getHeaderLabel = () => {
    if (activeView === 'day') {
      return currentDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (activeView === 'week') {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0];
      const end = weekDates[6];
      const startMonth = getMonthName(start.getMonth()).slice(0, 3);
      const endMonth = getMonthName(end.getMonth()).slice(0, 3);

      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      }

      if (start.getFullYear() === end.getFullYear()) {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
      }

      return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${monthName} ${year}`;
  };

  const headerLabel = getHeaderLabel();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.monthNav}>
          <Pressable onPress={onPrevMonth} style={styles.iconButton}>
            <IconSymbol name="chevron.left" size={22} color={iconColor} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
            {headerLabel}
          </ThemedText>
          <Pressable onPress={onNextMonth} style={styles.iconButton}>
            <IconSymbol name="chevron.right" size={22} color={iconColor} />
          </Pressable>
        </View>
        <Pressable
          onPress={onToday}
          style={[styles.todayButton, { borderColor: tintColor }]}
        >
          <ThemedText style={[styles.todayText, { color: tintColor }]}>Today</ThemedText>
        </Pressable>
      </View>

      {currentView && onViewChange && (
        <View style={[styles.switcher, { borderColor }]}>
          {views.map((view) => {
            const isSelected = view === currentView;
            return (
              <Pressable
                key={view}
                onPress={() => onViewChange(view)}
                style={[styles.switcherButton, isSelected && { backgroundColor: tintColor }]}
              >
                <ThemedText
                  style={styles.switcherText}
                  lightColor={isSelected ? '#FFFFFF' : undefined}
                  darkColor={isSelected ? '#FFFFFF' : undefined}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthNav: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginHorizontal: 4,
    flexShrink: 1,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switcher: {
    marginTop: 8,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
  },
  switcherButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  switcherText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
