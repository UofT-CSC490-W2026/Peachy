import { Platform } from 'react-native';

/**
 * Registers the device for push notifications using expo-notifications.
 * Returns the Expo push token, or null if permission was denied or unavailable.
 *
 * Prerequisites:
 *   npx expo install expo-notifications
 *   Add to app.json plugins: ["expo-notifications"]
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  let Notifications: typeof import('expo-notifications');
  try {
    Notifications = await import('expo-notifications');
  } catch {
    console.warn('expo-notifications not installed — push notifications disabled');
    return null;
  }

  // Android 8+ requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Peachy',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8C6B',
    });
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  try {
    // projectId is required in bare/managed workflow when it can't be inferred
    const { projectId } = (await import('expo-constants')).default.expoConfig?.extra?.eas ?? {};
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData.data;
  } catch (err) {
    console.warn('Failed to get Expo push token:', err);
    return null;
  }
}

/**
 * Configures how notifications appear when the app is in the foreground.
 * Call this once at app startup (before any notifications can arrive).
 */
export async function configureNotificationHandler(): Promise<void> {
  let Notifications: typeof import('expo-notifications');
  try {
    Notifications = await import('expo-notifications');
  } catch {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
