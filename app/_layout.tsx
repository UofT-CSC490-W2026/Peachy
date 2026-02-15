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

          {/* Modal screens - all use custom headers */}
          <Stack.Screen name="event-create" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="event-detail" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="event-edit" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="calendar-create" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="calendar-settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="chat-detail" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="user-search" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="profile-edit" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CalendarProvider>
  );
}
