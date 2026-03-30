import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { createApiClient } from '@/utils/api-client';
import { useAuth } from '@/contexts/auth-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleCalendarItem {
  id: string;
  name: string;
  color: string;   // hex color from Google
  primary: boolean;
}

interface GoogleCalendarContextType {
  isLinked: boolean;
  isLinking: boolean;
  /** Open Google OAuth in browser. Resolves true if user completed the flow. */
  startLink: () => Promise<boolean>;
  /** Fetch the user's Google Calendar list (requires prior link). */
  listCalendars: () => Promise<GoogleCalendarItem[]>;
  /** Create Peachy calendars for the chosen Google calendars and start sync. */
  selectCalendars: (calendarIds: string[]) => Promise<void>;
  /** Revoke Google access and remove all synced data. */
  disconnect: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken, fetchProfile } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Sync linked state from user profile (updated by auth context after /users/me)
  useEffect(() => {
    setIsLinked(user?.googleCalendarLinked === true);
  }, [user?.googleCalendarLinked]);

  const apiClient = createApiClient(getIdToken);

  const startLink = useCallback(async (): Promise<boolean> => {
    setIsLinking(true);
    try {
      const { authUrl } = await apiClient.get<{ authUrl: string }>('/google-calendar/auth-url');

      const scheme = (Constants.expoConfig?.scheme as string) ?? 'peachy-dev';
      const redirectUrl = `${scheme}://google-calendar-linked`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success') {
        // The backend stored the refresh token and redirected here.
        // Refresh our local profile so isLinked updates.
        await fetchProfile();
        setIsLinked(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google Calendar link failed:', err);
      return false;
    } finally {
      setIsLinking(false);
    }
  }, [getIdToken, fetchProfile]);

  const listCalendars = useCallback(async (): Promise<GoogleCalendarItem[]> => {
    const data = await apiClient.get<{ calendars: GoogleCalendarItem[] }>('/google-calendar/calendars');
    return data.calendars;
  }, [getIdToken]);

  const selectCalendars = useCallback(async (calendarIds: string[]): Promise<void> => {
    await apiClient.post('/google-calendar/calendars', { calendarIds });
    // Refresh user profile in case backend updates GoogleCalendarLinked
    await fetchProfile();
  }, [getIdToken, fetchProfile]);

  const disconnect = useCallback(async (): Promise<void> => {
    await apiClient.del('/google-calendar/link');
    setIsLinked(false);
    await fetchProfile();
  }, [getIdToken, fetchProfile]);

  return (
    <GoogleCalendarContext.Provider value={{
      isLinked,
      isLinking,
      startLink,
      listCalendars,
      selectCalendars,
      disconnect,
    }}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (!context) throw new Error('useGoogleCalendar must be used within GoogleCalendarProvider');
  return context;
}
