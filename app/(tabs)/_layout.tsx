import { Tabs } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  Keyboard,
  LayoutChangeEvent,
} from 'react-native';
import Constants from 'expo-constants';

import { HapticTab } from '@/components/haptic-tab';
import { HomeIcon, CalendarIcon, ChatIcon, ProfileIcon } from '@/components/ui/tab-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { ApiError, AuthError } from '@/utils/api-client';
import type { AIParseResult } from '@/utils/ai-parser';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tabBarBg = theme.surface;
  const router = useRouter();
  const { getIdToken } = useAuth();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tabBarHeight, setTabBarHeight] = useState(50);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const onTabBarLayout = useCallback((e: LayoutChangeEvent) => {
    setTabBarHeight(e.nativeEvent.layout.height);
  }, []);

  const openSheet = useCallback(() => {
    setSheetVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      inputRef.current?.focus();
    });
  }, [slideAnim]);

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setInputText('');
    });
  }, [slideAnim]);

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

      closeSheet();
      router.push({
        pathname: '/event-create',
        params: {
          aiGenerated: 'true',
          aiInput: message,
          title: parsed.extractedData.title || '',
          startTime: parsed.extractedData.startTime || '',
          endTime: parsed.extractedData.endTime || '',
          isAllDay: parsed.extractedData.isAllDay ? 'true' : 'false',
          location: parsed.extractedData.location || '',
          inviteeIds: parsed.extractedData.invitedUserIds?.join(',') || '',
          aiSuggested: JSON.stringify(parsed),
        },
      });
    } catch {
      Alert.alert('Error', 'Could not understand your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, getIdToken, closeSheet, router]);

  const handleMicPress = useCallback(() => {
    Alert.alert(
      'Voice Input',
      'Voice input coming soon! For now, try typing:\n\n• "dinner with Jordan tomorrow at 7pm"\n• "meeting with Taylor next Monday 2pm"\n• "lunch Friday at noon"',
      [{ text: 'OK' }],
    );
  }, []);

  const [sheetHeight, setSheetHeight] = useState(64);
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  return (
    <View style={styles.root}>
      <Tabs
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
              <View style={[styles.plusSquare, { backgroundColor: sheetVisible ? theme.text : theme.icon }]}>
                <View style={[styles.plusH, { backgroundColor: tabBarBg }]} />
                <View style={[styles.plusV, { backgroundColor: tabBarBg }]} />
              </View>
            ),
            tabBarButton: ({ children, style }) => (
              <Pressable
                onPress={() => sheetVisible ? closeSheet() : openSheet()}
                onLongPress={handleMicPress}
                onLayout={onTabBarLayout}
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

      {/* AI Input Bar — slides up from under the tab bar, clipped so it doesn't overlap */}
      <View style={[styles.sheetClip, { bottom: tabBarHeight, height: sheetVisible ? sheetHeight : 0, overflow: 'hidden' }]}>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.inputRow, { borderColor: theme.border }]}>
            <Pressable onPress={handleMicPress} style={styles.micButton} disabled={isLoading}>
              <IconSymbol name="mic.fill" size={20} color={theme.icon} />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: theme.text }]}
              placeholder="Schedule with AI..."
              placeholderTextColor={theme.icon}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                // Force textarea to recalculate height on web
                const el = (inputRef.current as any)?._node ?? (inputRef.current as any);
                if (el?.style) {
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }
              }}
              multiline
              editable={!isLoading}
            />
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.tint} style={styles.sendArea} />
            ) : (
              inputText.trim().length > 0 && (
                <Pressable
                  onPress={() => handleSend()}
                  style={[styles.sendBtn, { backgroundColor: theme.tint }]}
                >
                  <IconSymbol name="arrow.up.circle.fill" size={28} color="#FFFFFF" />
                </Pressable>
              )
            )}
          </View>
        </Animated.View>
      </View>
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
  sheetClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 11,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
