import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Calendar, CalendarEvent } from '@/types';
import { formatDateRange } from '@/utils/date-helpers';

interface MonthDayPreviewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  calendars: Calendar[];
  maxItems?: number;
}

export function MonthDayPreview({
  selectedDate,
  events,
  calendars,
  maxItems = 3,
}: MonthDayPreviewProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const previewEvents = sortedEvents.slice(0, maxItems);
  const remainingCount = Math.max(0, sortedEvents.length - previewEvents.length);
  const dateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderColor, backgroundColor: surfaceColor }]}>
        <View style={styles.headerRow}>
          <ThemedText type="defaultSemiBold">{dateLabel}</ThemedText>
          <ThemedText lightColor={textSecondary} darkColor={textSecondary} style={styles.headerMeta}>
            {sortedEvents.length} event{sortedEvents.length === 1 ? '' : 's'}
          </ThemedText>
        </View>

        {previewEvents.length === 0 ? (
          <ThemedText lightColor={textSecondary} darkColor={textSecondary} style={styles.emptyText}>
            No events scheduled
          </ThemedText>
        ) : (
          <View style={styles.list}>
            {previewEvents.map((event) => {
              const calendarColor = calendars.find((calendar) => calendar.id === event.calendarId)?.color ?? '#FF8C6B';
              const timeRange = formatDateRange(
                new Date(event.startTime),
                new Date(event.endTime),
                event.isAllDay,
              );

              return (
                <Pressable
                  key={event.id}
                  onPress={() =>
                    router.push({
                      pathname: '/event-detail',
                      params: { id: event.id },
                    })
                  }
                  style={styles.itemRow}
                >
                  <View style={[styles.dot, { backgroundColor: calendarColor }]} />
                  <View style={styles.itemContent}>
                    <ThemedText numberOfLines={1} style={styles.itemTitle}>
                      {event.title}
                    </ThemedText>
                    <ThemedText lightColor={textSecondary} darkColor={textSecondary} style={styles.itemMeta}>
                      {timeRange}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}

            {remainingCount > 0 && (
              <ThemedText lightColor={textSecondary} darkColor={textSecondary} style={styles.moreText}>
                +{remainingCount} more event{remainingCount === 1 ? '' : 's'}
              </ThemedText>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
    marginTop: 0,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
