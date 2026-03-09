import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarProvider } from '@/contexts/calendar-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider as AppThemeProvider } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isRestoring } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // All hooks must run unconditionally before any conditional return.
  useEffect(() => {
    if (isRestoring) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestoring, segments, router]);

  // S13: Render a neutral loading screen while the session is being restored so
  // that protected tab content never briefly flashes before the redirect fires.
  if (isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <CalendarProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="appearance" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="interests" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CalendarProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </AuthProvider>
  );
}
