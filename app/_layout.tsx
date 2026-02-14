import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarProvider } from '@/contexts/calendar-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CalendarProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event-create" options={{ presentation: 'modal', title: 'New Event' }} />
          <Stack.Screen name="calendar-create" options={{ presentation: 'modal', title: 'New Calendar' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CalendarProvider>
  );
}
