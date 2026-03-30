import { Tabs } from 'expo-router';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HapticTab } from '@/components/haptic-tab';
import { HomeIcon, CalendarIcon, ChatIcon, ProfileIcon } from '@/components/ui/tab-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { useCalendar } from '@/contexts/calendar-context';
import { ApiError, AuthError } from '@/utils/api-client';
import type { AIParseResult } from '@/utils/ai-parser';
import { transcribeAudio } from '@/utils/audio-transcribe';
import { getSlotIndex } from '@/utils/rl-helpers';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tabBarBg = theme.surface;
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { calendars, createEvent } = useCalendar();

  const [tabBarHeight, setTabBarHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice input.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');

      const transcript = await transcribeAudio(uri, getIdToken);
      if (transcript.trim()) {
        setInputText(prev => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
        inputRef.current?.focus();
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
      }
    } catch (err) {
      if (err instanceof AuthError) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        Alert.alert('Transcription Failed', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [getIdToken]);

  const handleMicPress = useCallback(() => {
    if (isTranscribing || isLoading) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isTranscribing, isLoading, startRecording, stopRecording]);

  const openSheet = useCallback(() => {
    setSheetVisible(true);
    heightAnim.setValue(0);
    Animated.parallel([
      Animated.timing(heightAnim, { toValue: sheetHeight, duration: 200, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => { inputRef.current?.focus(); });
  }, [heightAnim, rotateAnim, sheetHeight]);

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
      setIsRecording(false);
    }
    Animated.parallel([
      Animated.timing(heightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => { setSheetVisible(false); setInputText(''); });
  }, [heightAnim, rotateAnim]);

  const handleSend = useCallback(async (text?: string) => {
    const message = (text ?? inputText).trim();
    if (!message || isLoading) return;

    setIsLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new AuthError();

      const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
      const apiUrl = (extra.apiUrl ?? '').replace(/\/$/, '');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(`${apiUrl}/ai/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inputText: message, timezone }),
      });

      if (response.status === 401) throw new AuthError();
      if (!response.ok) {
        let errMsg = `Request failed with status ${response.status}`;
        try {
          const errorBody = await response.json() as Record<string, unknown>;
          if (typeof errorBody.message === 'string') errMsg = errorBody.message;
        } catch { /* ignore */ }
        throw new ApiError(errMsg, response.status);
      }

      const parsed = await response.json() as AIParseResult;
      const data = parsed.extractedData;

      const calendarId = calendars[0]?.id;
      if (!calendarId) {
        Alert.alert('No Calendar', 'Please create a calendar first before using AI scheduling.');
        closeSheet();
        return;
      }

      await createEvent(calendarId, {
        title: data.title || 'Untitled Event',
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay ?? false,
        timezone,
        ...(data.location ? { location: data.location } : {}),
        invitedUserIds: data.invitedUserIds || [],
        aiGenerated: true,
        aiInput: message,
        aiSuggested: parsed,
      });

      if (user && data.startTime) {
        const suggestedSlotIndex = getSlotIndex(new Date(data.startTime));
        fetch(`${apiUrl}/users/${encodeURIComponent(user.id)}/rl/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'accept', suggestedSlotIndex }),
        }).catch(() => {});
      }

      closeSheet();
      Alert.alert('Event Created', `"${data.title}" has been added to your calendar.`);
    } catch (err) {
      console.error('AI send error:', err);
      Alert.alert('Error', 'Could not create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, getIdToken, closeSheet, calendars, createEvent, user]);

  const renderTabBar = useCallback((props: BottomTabBarProps) => (
    <View>
      {sheetVisible && (
        <Animated.View style={{ bottom: keyboardAnim, position: 'relative' }}>
          <Animated.View style={{ height: heightAnim, overflow: 'hidden' }}>
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0) setSheetHeight(h);
              }}
              style={[
                styles.sheetInline,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <View style={[styles.inputRow, { borderColor: isRecording ? theme.danger : theme.border }]}>
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={theme.tint} style={styles.micButton} />
                ) : (
                  <Pressable onPress={handleMicPress} style={styles.micButton} disabled={isLoading}>
                    <IconSymbol
                      name={isRecording ? 'stop.fill' : 'mic.fill'}
                      size={20}
                      color={isRecording ? theme.danger : theme.icon}
                    />
                  </Pressable>
                )}
                {isRecording ? (
                  <ThemedText style={[styles.recordingText, { color: theme.danger }]}>
                    Recording... tap stop when done
                  </ThemedText>
                ) : (
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: theme.text }]}
                    placeholder={isTranscribing ? 'Transcribing...' : 'Schedule with AI...'}
                    placeholderTextColor={theme.icon}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    editable={!isLoading && !isTranscribing}
                  />
                )}
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.tint} style={styles.sendArea} />
                ) : (
                  !isRecording && inputText.trim().length > 0 && (
                    <Pressable
                      onPress={() => handleSend()}
                      style={[styles.sendBtn, { backgroundColor: theme.tint }]}
                      disabled={isTranscribing}
                    >
                      <IconSymbol name="arrow.up.circle.fill" size={28} color="#FFFFFF" />
                    </Pressable>
                  )
                )}
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}
      <View
        onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}
        style={Platform.OS === 'android' && isKeyboardVisible && tabBarHeight > 0
          ? { height: tabBarHeight }
          : undefined}
      >
        {!(Platform.OS === 'android' && isKeyboardVisible) && <BottomTabBar {...props} />}
      </View>
    </View>
  ), [sheetVisible, heightAnim, keyboardAnim, theme, isRecording, isTranscribing, isLoading, inputText, isKeyboardVisible, tabBarHeight, handleMicPress, handleSend]);

  // Track keyboard height so the sheet stays above the keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setIsKeyboardVisible(true);
      const windowHeight = Dimensions.get('window').height;
      const keyboardHeight = Math.max(0, e.endCoordinates?.height ?? 0);
      const keyboardFrameHeight = Platform.OS === 'android' && typeof e.endCoordinates?.screenY === 'number'
        ? Math.max(0, windowHeight - e.endCoordinates.screenY)
        : keyboardHeight;
      const keyboardOffset = Platform.OS === 'ios'
        ? Math.max(0, keyboardHeight - tabBarHeight)
        : Math.max(0, keyboardFrameHeight - tabBarHeight);
      Animated.timing(keyboardAnim, {
        toValue: keyboardOffset,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });
    const onHide = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardVisible(false);
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e?.duration ?? 200) : 200,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardAnim, tabBarHeight]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const [sheetHeight, setSheetHeight] = useState(64);
  const plusRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          tabBarActiveTintColor: theme.text,
          tabBarInactiveTintColor: theme.icon,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarStyle: {
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <HomeIcon color={theme.text} size={24} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendars"
          options={{
            title: 'Calendars',
            tabBarIcon: ({ focused }) => (
              <CalendarIcon color={theme.text} bg={tabBarBg} size={24} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: () => (
              <View style={[styles.plusSquare, { backgroundColor: sheetVisible ? theme.text : theme.tint }]}>
                <Animated.View style={[styles.plusIcon, { transform: [{ rotate: plusRotation }] }]}>
                  <View style={[styles.plusH, { backgroundColor: tabBarBg }]} />
                  <View style={[styles.plusV, { backgroundColor: tabBarBg }]} />
                </Animated.View>
              </View>
            ),
            tabBarButton: ({ children, style }) => (
              <Pressable
                onPress={() => sheetVisible ? closeSheet() : openSheet()}
                onLongPress={handleMicPress}
                style={[style, styles.createButton]}
              >
                {children}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused }) => (
              <ChatIcon color={theme.text} bg={tabBarBg} size={24} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <ProfileIcon color={theme.text} size={24} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  plusSquare: {
    width: 44,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusH: {
    position: 'absolute',
    width: 18,
    height: 3.5,
    borderRadius: 2,
  },
  plusV: {
    position: 'absolute',
    width: 3.5,
    height: 18,
    borderRadius: 2,
  },
  createButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetInline: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  micButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  recordingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendArea: {
    marginLeft: 4,
  },
});
