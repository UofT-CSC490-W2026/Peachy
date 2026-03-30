import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';

// Required for expo-web-browser auth sessions to close properly on redirect
WebBrowser.maybeCompleteAuthSession();

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarProvider } from '@/contexts/calendar-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider as AppThemeProvider } from '@/contexts/theme-context';
import { FriendsProvider } from '@/contexts/friends-context';
import { ChatProvider } from '@/contexts/chat-context';
import { GoogleCalendarProvider, useGoogleCalendar } from '@/contexts/google-calendar-context';
import { registerForPushNotifications, configureNotificationHandler } from '@/utils/notifications';
import { createApiClient } from '@/utils/api-client';

// Configure foreground notification display at module load time
configureNotificationHandler();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isRestoring, getIdToken } = useAuth();
  const { isLinked: gcalLinked } = useGoogleCalendar();
  const segments = useSegments();
  const router = useRouter();
  const pushRegisteredRef = useRef(false);
  const gcalPromptShownRef = useRef(false);

  // All hooks must run unconditionally before any conditional return.
  useEffect(() => {
    if (isRestoring) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      pushRegisteredRef.current = false; // Reset on logout
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestoring, segments, router]);

  // Show Google Calendar prompt once after first login if not already linked
  useEffect(() => {
    if (!isAuthenticated || isRestoring || gcalLinked || gcalPromptShownRef.current) return;
    const inTabs = segments[0] === '(tabs)';
    if (!inTabs) return;

    gcalPromptShownRef.current = true;
    // Small delay so the tabs screen renders first
    const timer = setTimeout(() => {
      router.push('/google-calendar-prompt');
    }, 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isRestoring, gcalLinked, segments, router]);

  // Register for push notifications once after login
  useEffect(() => {
    if (!isAuthenticated || isRestoring || pushRegisteredRef.current) return;

    pushRegisteredRef.current = true;
    const apiClient = createApiClient(getIdToken);

    registerForPushNotifications().then(token => {
      if (!token) return;
      apiClient.put('users/me/push-token', { pushToken: token }).catch(err => {
        console.warn('Failed to register push token:', err);
      });
    });
  }, [isAuthenticated, isRestoring, getIdToken]);

  // Handle notification taps — navigate to Home where pending items are shown
  useEffect(() => {
    if (!isAuthenticated) return;

    let subscription: { remove: () => void } | null = null;

    import('expo-notifications').then(Notifications => {
      subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;

        if ((data?.type === 'event_invite' || data?.type === 'event_update') && data.eventId) {
          // Deep-link directly to the event detail
          router.push({ pathname: '/event-detail', params: { id: data.eventId } });
        } else {
          // Default: go to Home tab where pending items are listed
          router.replace('/(tabs)');
        }
      });
    }).catch(() => {/* expo-notifications not installed */});

    return () => { subscription?.remove(); };
  }, [isAuthenticated, router]);

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
      <FriendsProvider>
        <ChatProvider>
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
          <Stack.Screen name="settings" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="appearance" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="friends" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="interests" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="google-calendar-prompt" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="google-calendar-link" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </ChatProvider>
      </FriendsProvider>
    </CalendarProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <GoogleCalendarProvider>
          <RootNavigator />
        </GoogleCalendarProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
