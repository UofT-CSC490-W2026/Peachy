import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { Calendar, CalendarEvent, CalendarType, PendingItem, User } from '@/types';
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
  addCalendarMember: (calendarId: string, userId: string) => Promise<void>;
  removeCalendarMember: (calendarId: string, userId: string) => Promise<void>;
  // Event CRUD
  createEvent: (calendarId: string, data: CreateEventInput) => Promise<CalendarEvent>;
  updateEvent: (calendarId: string, eventId: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (calendarId: string, eventId: string) => Promise<void>;
  // Pending items
  refreshPendingItems: () => Promise<void>;
  acceptPendingItem: (itemId: string, sk?: string, calendarId?: string) => Promise<void>;
  declinePendingItem: (itemId: string, sk?: string) => Promise<void>;
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

  // ── Pending items state (from API) ────────────────────────────────────────
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

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

      // Backfill: create a Personal calendar for any user who slipped through
      // without one (e.g. created before the post-confirmation trigger was deployed).
      if (rawCalendars.length === 0) {
        try {
          const created = await apiClient.post<Omit<Calendar, 'isVisible'>>('calendars', {
            name: 'Personal',
            color: '#FF8C6B',
            type: 'personal',
          });
          rawCalendars.push(created);
        } catch {
          // Non-fatal — user can create one manually
        }
      }

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

      // 3. Fetch pending items
      try {
        const pendingData = await apiClient.get<{ items: PendingItem[] }>('pending-items?status=pending');
        if (generation === loadGenRef.current) {
          setPendingItems(pendingData.items);
        }
      } catch {
        // Non-fatal: pending items might not be deployed yet
      }
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

  // Fetch pending items from the API (only 'pending' status)
  const loadPendingItems = useCallback(async () => {
    try {
      const result = await apiClient.get<{ items: any[] }>('pending-items?status=pending');
      const items: PendingItem[] = result.items.map(item => ({
        id: item.id,
        sk: item.sk,
        type: item.type,
        status: item.status,
        fromUserId: item.fromUserId,
        toUserId: item.toUserId,
        calendarId: item.calendarId,
        eventId: item.eventId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      setPendingItems(items);
    } catch (err) {
      if (err instanceof AuthError) return;
      // Non-fatal — pending items are supplementary
      console.warn('Failed to load pending items:', err);
    }
  }, [apiClient]);

  // Load data when user logs in; clear when user logs out
  useEffect(() => {
    if (user) {
      loadData();
      loadPendingItems();
    } else {
      setCalendars([]);
      setEvents([]);
      setPendingItems([]);
      setError(null);
    }
  }, [user, loadData, loadPendingItems]);

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

  const addCalendarMember = useCallback(async (calendarId: string, userId: string): Promise<void> => {
    await apiClient.post(`calendars/${calendarId}/members/${userId}`, {});
    setCalendars(prev => prev.map(c =>
      c.id === calendarId && !c.memberIds.includes(userId)
        ? { ...c, memberIds: [...c.memberIds, userId] }
        : c
    ));
  }, [apiClient]);

  const removeCalendarMember = useCallback(async (calendarId: string, userId: string): Promise<void> => {
    await apiClient.del(`calendars/${calendarId}/members/${userId}`);
    setCalendars(prev => prev.map(c =>
      c.id === calendarId
        ? { ...c, memberIds: c.memberIds.filter(id => id !== userId) }
        : c
    ));
  }, [apiClient]);

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

  // ── Pending item actions (API) ──────────────────────────────────────────

  const refreshPendingItems = useCallback(async () => {
    try {
      const data = await apiClient.get<{ items: PendingItem[] }>('pending-items?status=pending');
      setPendingItems(data.items);
    } catch (err) {
      console.error('Failed to refresh pending items:', err);
    }
  }, [apiClient]);

  const acceptPendingItem = useCallback(async (itemId: string, sk?: string, calendarId?: string) => {
    // Optimistic update
    setPendingItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'accepted' as const } : item
    ));
    try {
      const body: Record<string, string> = {};
      if (sk) body.sk = sk;
      if (calendarId) body.calendarId = calendarId;
      const result = await apiClient.post<{ createdEvent?: CalendarEvent }>(`pending-items/${itemId}/accept`, body);
      // If the backend returned a new event copy, add it to local state immediately
      if (result.createdEvent) {
        setEvents(prev => [...prev, result.createdEvent!]);
      }
      await refreshPendingItems();
    } catch (err) {
      await refreshPendingItems(); // revert
      throw err;
    }
  }, [apiClient, refreshPendingItems]);

  const declinePendingItem = useCallback(async (itemId: string, sk?: string) => {
    setPendingItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'declined' as const } : item
    ));
    try {
      await apiClient.post(`pending-items/${itemId}/decline`, { ...(sk ? { sk } : {}) });
      await refreshPendingItems();
    } catch (err) {
      await refreshPendingItems();
      throw err;
    }
  }, [apiClient, refreshPendingItems]);

  // ── User lookup (cached, with current user from auth) ────────────────────

  const userCacheRef = useRef<Map<string, User>>(new Map());

  const getUser = useCallback((userId: string): User | undefined => {
    // Check current logged-in user
    if (user && userId === user.id) {
      return {
        id: user.id,
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        avatarUrl: user.avatarUrl,
        createdAt: '',
        updatedAt: '',
      };
    }
    // Check cache
    return userCacheRef.current.get(userId);
  }, [user]);

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
        refreshPendingItems,
        acceptPendingItem,
        declinePendingItem,
        addCalendarMember,
        removeCalendarMember,
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
