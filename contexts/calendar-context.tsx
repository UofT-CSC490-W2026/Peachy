import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { Calendar, CalendarEvent, CalendarType, PendingItem, Chat, ChatMessage, User } from '@/types';
import { mockPendingItems, mockChats, currentUser, contacts } from '@/data/mock-data';
import { useAuth } from '@/contexts/auth-context';
import { createApiClient, AuthError } from '@/utils/api-client';

// ─── Input types for API mutations ────────────────────────────────────────────

export interface CreateCalendarInput {
  name: string;
  color: string;
  type: CalendarType;
  description?: string;
}

export interface CreateEventInput {
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  timezone: string;
  location?: string;
  description?: string;
  invitedUserIds?: string[];
  aiGenerated?: boolean;
  aiInput?: string;
  aiSuggested?: object;
  aiEditedFields?: string[];
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface CalendarContextType {
  // Data
  calendars: Calendar[];
  events: CalendarEvent[];
  visibleEvents: CalendarEvent[];
  pendingItems: PendingItem[];
  chats: Chat[];
  // Loading state
  isLoading: boolean;
  error: string | null;
  // User lookup (still mocked)
  getUser: (userId: string) => User | undefined;
  // Calendar visibility (client-side)
  toggleCalendarVisibility: (calendarId: string) => void;
  // Calendar CRUD
  refreshCalendars: () => Promise<void>;
  createCalendar: (data: CreateCalendarInput) => Promise<Calendar>;
  updateCalendar: (id: string, data: Partial<Calendar>) => Promise<void>;
  deleteCalendar: (id: string) => Promise<void>;
  // Event CRUD
  createEvent: (calendarId: string, data: CreateEventInput) => Promise<CalendarEvent>;
  updateEvent: (calendarId: string, eventId: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
  // Pending items / invite actions (still mocked)
  acceptEventInvite: (eventId: string) => void;
  declineEventInvite: (eventId: string) => void;
  // Chat actions (still mocked)
  getChatMessages: (chatId: string) => ChatMessage[];
  updateChatMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();

  // Create a stable API client bound to the current token getter
  const apiClient = useMemo(() => createApiClient(getIdToken), [getIdToken]);

  // ── Calendar + event state (from API) ──────────────────────────────────────
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Still-mocked state ────────────────────────────────────────────────────
  const [pendingItems, setPendingItems] = useState<PendingItem[]>(mockPendingItems);
  const [chats] = useState<Chat[]>(mockChats);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    mockChats.forEach(chat => {
      initial[chat.id] = chat.lastMessage ? [chat.lastMessage] : [];
    });
    return initial;
  });

  // ── API data loading ──────────────────────────────────────────────────────

  // Generation counter: prevents stale concurrent requests from overwriting newer data
  const loadGenRef = useRef(0);

  const loadData = useCallback(async () => {
    const generation = ++loadGenRef.current;

    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all calendars
      const rawCalendars = await apiClient.get<Omit<Calendar, 'isVisible'>[]>('calendars');
      if (generation !== loadGenRef.current) return; // stale — a newer call is in flight

      const calendarsWithVisibility: Calendar[] = rawCalendars.map(cal => ({
        ...cal,
        isVisible: true,
      }));
      setCalendars(calendarsWithVisibility);

      // 2. Fetch events for each calendar in parallel
      const eventsArrays = await Promise.all(
        rawCalendars.map(cal =>
          apiClient.get<CalendarEvent[]>(`calendars/${cal.id}/events`)
        )
      );
      if (generation !== loadGenRef.current) return; // stale

      setEvents(eventsArrays.flat());
    } catch (err) {
      if (generation !== loadGenRef.current) return;
      if (err instanceof AuthError) {
        // Auth errors are handled by the auth context — don't show a UI error
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      if (generation === loadGenRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiClient]);

  // Load data when user logs in; clear when user logs out
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCalendars([]);
      setEvents([]);
      setError(null);
    }
  }, [user, loadData]);

  // ── Calendar mutations ────────────────────────────────────────────────────

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId ? { ...cal, isVisible: !cal.isVisible } : cal
      )
    );
  }, []);

  const refreshCalendars = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const createCalendar = useCallback(async (data: CreateCalendarInput): Promise<Calendar> => {
    // Optimistic: add a placeholder immediately
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimistic: Calendar = {
      id: tempId,
      ownerId: user?.id ?? '',
      memberIds: [user?.id ?? ''],
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    setCalendars(prev => [...prev, optimistic]);

    try {
      const created = await apiClient.post<Omit<Calendar, 'isVisible'>>('calendars', data);
      const withVisibility: Calendar = { ...created, isVisible: true };
      setCalendars(prev => prev.map(c => c.id === tempId ? withVisibility : c));
      return withVisibility;
    } catch (err) {
      // Revert optimistic update on error
      setCalendars(prev => prev.filter(c => c.id !== tempId));
      throw err;
    }
  }, [apiClient, user]);

  const updateCalendar = useCallback(async (id: string, data: Partial<Calendar>): Promise<void> => {
    // Capture previous state for rollback
    let previous: Calendar | undefined;
    setCalendars(prev => {
      previous = prev.find(c => c.id === id);
      return prev.map(c => c.id === id ? { ...c, ...data } : c);
    });

    try {
      // Exclude client-side-only fields before sending to API
      const { isVisible: _isVisible, ...apiData } = data;
      await apiClient.put<Omit<Calendar, 'isVisible'>>(`calendars/${id}`, apiData);
    } catch (err) {
      // Revert optimistic update to the previous state
      if (previous) {
        setCalendars(prev => prev.map(c => c.id === id ? previous! : c));
      }
      throw err;
    }
  }, [apiClient]);

  const deleteCalendar = useCallback(async (id: string): Promise<void> => {
    let backup: Calendar | undefined;
    setCalendars(prev => {
      backup = prev.find(c => c.id === id);
      return prev.filter(c => c.id !== id);
    });
    // Also remove events in that calendar
    setEvents(prev => prev.filter(e => e.calendarId !== id));

    try {
      await apiClient.del(`calendars/${id}`);
    } catch (err) {
      // Revert optimistic update on error
      if (backup) {
        setCalendars(prev => [...prev, backup!]);
      }
      // Events will be restored on next load
      await loadData();
      throw err;
    }
  }, [apiClient, loadData]);

  // ── Event mutations ───────────────────────────────────────────────────────

  const createEvent = useCallback(async (
    calendarId: string,
    data: CreateEventInput
  ): Promise<CalendarEvent> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimistic: CalendarEvent = {
      id: tempId,
      calendarId,
      status: 'confirmed',
      reminders: [],
      createdBy: user?.id ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      invitedUserIds: data.invitedUserIds ?? [],
      ...data,
    };
    setEvents(prev => [...prev, optimistic]);

    try {
      const created = await apiClient.post<CalendarEvent>(`calendars/${calendarId}/events`, data);
      setEvents(prev => prev.map(e => e.id === tempId ? created : e));
      return created;
    } catch (err) {
      setEvents(prev => prev.filter(e => e.id !== tempId));
      throw err;
    }
  }, [apiClient, user]);

  const updateEvent = useCallback(async (
    calendarId: string,
    eventId: string,
    data: Partial<CalendarEvent>
  ): Promise<void> => {
    // Optimistic update
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, ...data } : e)
    );

    try {
      await apiClient.put<CalendarEvent>(`calendars/${calendarId}/events/${eventId}`, data);
    } catch (err) {
      // Revert by reloading
      await loadData();
      throw err;
    }
  }, [apiClient, loadData]);

  const deleteEvent = useCallback(async (calendarId: string, eventId: string): Promise<void> => {
    let backup: CalendarEvent | undefined;
    setEvents(prev => {
      backup = prev.find(e => e.id === eventId);
      return prev.filter(e => e.id !== eventId);
    });

    try {
      await apiClient.del(`calendars/${calendarId}/events/${eventId}`);
    } catch (err) {
      if (backup) {
        setEvents(prev => [...prev, backup!]);
      }
      throw err;
    }
  }, [apiClient]);

  // ── Invite actions (still mocked — pending items not yet in backend) ───────

  const updateEventInviteStatus = useCallback((
    eventId: string,
    status: 'accepted' | 'declined'
  ) => {
    setPendingItems(prev =>
      prev.map(item =>
        item.eventId === eventId ? { ...item, status } : item
      )
    );
    setChatMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = updated[chatId].map(msg =>
          msg.eventId === eventId ? { ...msg, inviteStatus: status } : msg
        );
      });
      return updated;
    });
  }, []);

  const acceptEventInvite = useCallback((eventId: string) => {
    updateEventInviteStatus(eventId, 'accepted');
  }, [updateEventInviteStatus]);

  const declineEventInvite = useCallback((eventId: string) => {
    updateEventInviteStatus(eventId, 'declined');
  }, [updateEventInviteStatus]);

  // ── Chat actions (still mocked) ───────────────────────────────────────────

  const getChatMessages = useCallback((chatId: string): ChatMessage[] => {
    return chatMessages[chatId] || [];
  }, [chatMessages]);

  const updateChatMessage = useCallback((
    chatId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => {
    setChatMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));

    if (updates.inviteStatus && updates.eventId) {
      setPendingItems(prev =>
        prev.map(item =>
          item.eventId === updates.eventId
            ? { ...item, status: updates.inviteStatus as 'pending' | 'accepted' | 'declined' }
            : item
        )
      );
    }
  }, []);

  // ── User lookup (still mocked — GET /users not yet implemented) ───────────

  const getUser = useCallback((userId: string): User | undefined => {
    if (userId === currentUser.id) return currentUser;
    return contacts.find(u => u.id === userId);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const visibleEvents = useMemo(() => {
    const visibleCalendarIds = new Set(
      calendars.filter(cal => cal.isVisible).map(cal => cal.id)
    );
    return events.filter(event => visibleCalendarIds.has(event.calendarId));
  }, [calendars, events]);

  return (
    <CalendarContext.Provider
      value={{
        calendars,
        events,
        visibleEvents,
        pendingItems,
        chats,
        isLoading,
        error,
        getUser,
        toggleCalendarVisibility,
        refreshCalendars,
        createCalendar,
        updateCalendar,
        deleteCalendar,
        createEvent,
        updateEvent,
        deleteEvent,
        acceptEventInvite,
        declineEventInvite,
        getChatMessages,
        updateChatMessage,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
