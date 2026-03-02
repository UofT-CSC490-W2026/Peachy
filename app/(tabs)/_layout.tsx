import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { HomeIcon, CalendarIcon, ChatIcon, ProfileIcon } from '@/components/ui/tab-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const styles = StyleSheet.create({
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
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tabBarBg = theme.surface;

  return (
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.plusSquare, { backgroundColor: focused ? theme.tint : theme.icon }]}>
              <View style={[styles.plusH, { backgroundColor: tabBarBg }]} />
              <View style={[styles.plusV, { backgroundColor: tabBarBg }]} />
            </View>
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
  );
}
