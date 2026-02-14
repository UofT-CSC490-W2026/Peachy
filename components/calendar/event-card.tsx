import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CalendarEvent } from '@/types';
import { formatDateRange } from '@/utils/date-helpers';

interface EventCardProps {
  event: CalendarEvent;
  calendarColor: string;
  onPress?: () => void;
}

export function EventCard({ event, calendarColor, onPress }: EventCardProps) {
  const router = useRouter();
  const surfaceColor = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const timeRange = formatDateRange(startTime, endTime, event.isAllDay);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/event-detail',
        params: { id: event.id },
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: surfaceColor, borderLeftColor: calendarColor },
      ]}
    >
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {event.title}
        </ThemedText>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <IconSymbol name="clock" size={14} color={textSecondary} />
            <ThemedText
              style={styles.detailText}
              lightColor={textSecondary}
              darkColor={textSecondary}
            >
              {timeRange}
            </ThemedText>
          </View>
          {event.location && (
            <View style={styles.detailRow}>
              <IconSymbol name="mappin" size={14} color={textSecondary} />
              <ThemedText
                style={styles.detailText}
                lightColor={textSecondary}
                darkColor={textSecondary}
                numberOfLines={1}
              >
                {event.location}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
});
