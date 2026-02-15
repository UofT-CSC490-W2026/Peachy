import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Calendar, CalendarEvent, PendingItem, Chat, ChatMessage, User } from '@/types';
import { mockCalendars, mockEvents, mockPendingItems, mockChats, currentUser, contacts } from '@/data/mock-data';

interface CalendarContextType {
  calendars: Calendar[];
  events: CalendarEvent[];
  visibleEvents: CalendarEvent[];
  pendingItems: PendingItem[];
  chats: Chat[];
  getUser: (userId: string) => User | undefined;
  toggleCalendarVisibility: (calendarId: string) => void;
  addEvent: (event: CalendarEvent) => void;
  addCalendar: (calendar: Calendar) => void;
  acceptEventInvite: (eventId: string) => void;
  declineEventInvite: (eventId: string) => void;
  getChatMessages: (chatId: string) => ChatMessage[];
  updateChatMessage: (chatId: string, messageId: string, updates: Partial<ChatMessage>) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [calendars, setCalendars] = useState<Calendar[]>(mockCalendars);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>(mockPendingItems);
  const [chats] = useState<Chat[]>(mockChats);

  // Initialize chat messages from mock chats
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    mockChats.forEach(chat => {
      initial[chat.id] = chat.lastMessage ? [chat.lastMessage] : [];
    });
    return initial;
  });

  const toggleCalendarVisibility = (calendarId: string) => {
    setCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId ? { ...cal, isVisible: !cal.isVisible } : cal
      )
    );
  };

  const addEvent = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
  };

  const addCalendar = (calendar: Calendar) => {
    setCalendars(prev => [...prev, calendar]);
  };

  // Accept event invite - syncs status in both pending items and chat messages
  const acceptEventInvite = (eventId: string) => {
    // Update pending items
    setPendingItems(prev =>
      prev.map(item =>
        item.eventId === eventId ? { ...item, status: 'accepted' } : item
      )
    );

    // Update chat messages
    setChatMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = updated[chatId].map(msg =>
          msg.eventId === eventId ? { ...msg, inviteStatus: 'accepted' } : msg
        );
      });
      return updated;
    });
  };

  // Decline event invite - syncs status in both pending items and chat messages
  const declineEventInvite = (eventId: string) => {
    // Update pending items
    setPendingItems(prev =>
      prev.map(item =>
        item.eventId === eventId ? { ...item, status: 'declined' } : item
      )
    );

    // Update chat messages
    setChatMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = updated[chatId].map(msg =>
          msg.eventId === eventId ? { ...msg, inviteStatus: 'declined' } : msg
        );
      });
      return updated;
    });
  };

  // Get chat messages for a specific chat
  const getChatMessages = (chatId: string): ChatMessage[] => {
    return chatMessages[chatId] || [];
  };

  // Update a specific chat message
  const updateChatMessage = (chatId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setChatMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));

    // If updating invite status, also update pending items
    if (updates.inviteStatus && updates.eventId) {
      setPendingItems(prev =>
        prev.map(item =>
          item.eventId === updates.eventId
            ? { ...item, status: updates.inviteStatus as 'pending' | 'accepted' | 'declined' }
            : item
        )
      );
    }
  };

  const visibleEvents = useMemo(() => {
    const visibleCalendarIds = new Set(
      calendars.filter(cal => cal.isVisible).map(cal => cal.id)
    );
    return events.filter(event => visibleCalendarIds.has(event.calendarId));
  }, [calendars, events]);

  // Get user by ID (for displaying user info in pending items)
  const getUser = (userId: string): User | undefined => {
    if (userId === currentUser.id) {
      return currentUser;
    }
    return contacts.find(user => user.id === userId);
  };

  return (
    <CalendarContext.Provider
      value={{
        calendars,
        events,
        visibleEvents,
        pendingItems,
        chats,
        getUser,
        toggleCalendarVisibility,
        addEvent,
        addCalendar,
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
