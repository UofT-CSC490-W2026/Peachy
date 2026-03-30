import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { CalendarEvent } from '@/types';
import { formatTime } from '@/utils/date-helpers';

interface EventBlockProps {
  event: CalendarEvent;
  color: string;
  top: number;
  height: number;
  onPress: () => void;
  left?: number;
  width?: number;
}

export function EventBlock({ event, color, top, height, onPress, left, width }: EventBlockProps) {
  const startTime = new Date(event.startTime);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.block,
        {
          backgroundColor: color + '30',
          borderLeftColor: color,
          top,
          height: Math.max(height, 30),
        },
        width !== undefined
          ? { left: `${left ?? 0}%`, width: `${width}%` }
          : { left: 0, right: 0 },
      ]}
    >
      <ThemedText
        style={styles.title}
        numberOfLines={1}
        lightColor={color}
        darkColor={color}
      >
        {event.title}
      </ThemedText>
      {height > 40 && (
        <ThemedText
          style={styles.time}
          numberOfLines={1}
          lightColor={color}
          darkColor={color}
        >
          {formatTime(startTime, event.timezone)}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    marginTop: 2,
  },
});
