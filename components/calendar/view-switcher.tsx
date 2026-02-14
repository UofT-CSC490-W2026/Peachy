import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type CalendarView = 'day' | 'week' | 'month';

interface ViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'borderLight');

  const views: CalendarView[] = ['day', 'week', 'month'];

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor, borderColor }]}>
      {views.map(view => {
        const isSelected = view === currentView;
        return (
          <Pressable
            key={view}
            onPress={() => onViewChange(view)}
            style={[
              styles.button,
              isSelected && { backgroundColor: tintColor },
            ]}
          >
            <ThemedText
              style={[
                styles.buttonText,
                isSelected && styles.selectedText,
              ]}
              lightColor={isSelected ? '#FFFFFF' : undefined}
              darkColor={isSelected ? '#FFFFFF' : undefined}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
