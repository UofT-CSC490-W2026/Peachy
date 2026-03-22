import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Friend, FriendshipStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { createApiClient } from '@/utils/api-client';

interface FriendsContextType {
  friends: Friend[];
  isLoading: boolean;
  refreshFriends: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  sendFriendRequestByEmail: (email: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  checkFriendship: (userId: string) => Promise<FriendshipStatus>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();
  const apiClient = useMemo(() => createApiClient(getIdToken), [getIdToken]);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ friends: Friend[] }>('friends');
      setFriends(data.friends);
    } catch (err) {
      // Silently fail — avoid logging error objects that may contain tokens
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    if (user) {
      refreshFriends();
    } else {
      setFriends([]);
    }
  }, [user, refreshFriends]);

  const sendFriendRequest = useCallback(async (userId: string) => {
    await apiClient.post('friends/requests', { userId });
  }, [apiClient]);

  const sendFriendRequestByEmail = useCallback(async (email: string) => {
    await apiClient.post('friends/requests', { email });
  }, [apiClient]);

  const removeFriend = useCallback(async (friendId: string) => {
    setFriends(prev => prev.filter(f => f.userId !== friendId));
    try {
      await apiClient.del(`friends/${friendId}`);
    } catch (err) {
      await refreshFriends(); // revert on error
      throw err;
    }
  }, [apiClient, refreshFriends]);

  const checkFriendship = useCallback(async (userId: string): Promise<FriendshipStatus> => {
    const data = await apiClient.get<{ status: FriendshipStatus }>(`friends/${userId}/status`);
    return data.status;
  }, [apiClient]);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        isLoading,
        refreshFriends,
        sendFriendRequest,
        sendFriendRequestByEmail,
        removeFriend,
        checkFriendship,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
