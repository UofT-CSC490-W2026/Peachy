import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Chat, ChatMessage, ChatMessageType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { createApiClient } from '@/utils/api-client';

interface ChatListItem {
  id: string;
  type: string;
  name: string;
  calendarId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  hasAccepted: boolean;
  status: string;
}

interface ChatContextType {
  chats: ChatListItem[];
  messageRequests: ChatListItem[];
  requestCount: number;
  isLoading: boolean;
  refreshChats: () => Promise<void>;
  createDmChat: (userId: string) => Promise<{ id: string; status: string }>;
  acceptMessageRequest: (chatId: string) => Promise<void>;
  getChatMessages: (chatId: string, cursor?: string) => Promise<{ messages: ChatMessage[]; nextCursor?: string }>;
  sendMessage: (chatId: string, content: string, type?: string, eventId?: string) => Promise<ChatMessage>;
  markChatRead: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();
  const apiClient = useMemo(() => createApiClient(getIdToken), [getIdToken]);

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messageRequests, setMessageRequests] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{
        chats: ChatListItem[];
        messageRequests: ChatListItem[];
        requestCount: number;
      }>('chats');
      setChats(data.chats);
      setMessageRequests(data.messageRequests);
    } catch (err) {
      // Silently fail — avoid logging error objects that may contain tokens
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (user) {
      refreshChats();
    } else {
      setChats([]);
      setMessageRequests([]);
    }
  }, [user, refreshChats]);

  const createDmChat = useCallback(async (userId: string) => {
    const data = await apiClient.post<{ id: string; status: string }>('chats', {
      participantIds: [userId],
      type: 'direct',
    });
    await refreshChats();
    return data;
  }, [apiClient, refreshChats]);

  const acceptMessageRequest = useCallback(async (chatId: string) => {
    await apiClient.put(`chats/${chatId}/accept`, {});
    await refreshChats();
  }, [apiClient, refreshChats]);

  const getChatMessages = useCallback(async (chatId: string, cursor?: string) => {
    const params = cursor ? `?cursor=${cursor}` : '';
    return await apiClient.get<{ messages: ChatMessage[]; nextCursor?: string }>(
      `chats/${chatId}/messages${params}`
    );
  }, [apiClient]);

  const sendMessage = useCallback(async (
    chatId: string,
    content: string,
    type: string = 'text',
    eventId?: string
  ) => {
    const message = await apiClient.post<ChatMessage>(`chats/${chatId}/messages`, {
      content,
      type,
      ...(eventId ? { eventId } : {}),
    });
    return message;
  }, [apiClient]);

  const markChatRead = useCallback(async (chatId: string) => {
    try {
      await apiClient.put(`chats/${chatId}/read-all`, {});
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      // Silently fail — non-critical
    }
  }, [apiClient]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        messageRequests,
        requestCount: messageRequests.length,
        isLoading,
        refreshChats,
        createDmChat,
        acceptMessageRequest,
        getChatMessages,
        sendMessage,
        markChatRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
