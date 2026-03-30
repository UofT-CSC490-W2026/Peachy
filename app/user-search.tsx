import { StyleSheet, View, TextInput, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { FriendshipStatus } from '@/types';
import { useFriends } from '@/contexts/friends-context';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { createApiClient } from '@/utils/api-client';

interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  friendshipStatus: FriendshipStatus;
}

export default function UserSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string || 'chat'; // 'chat', 'event', 'calendar', or 'friend'

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successColor = useThemeColor({}, 'success');

  const { getIdToken } = useAuth();
  const { sendFriendRequest } = useFriends();
  const { createDmChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const apiClientRef = useRef(createApiClient(getIdToken));

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await apiClientRef.current.get<{ users: SearchUser[] }>(
        `users/search?q=${encodeURIComponent(query.trim())}&limit=20`
      );
      setSearchResults(data.users);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(text), 300);
  }, [performSearch]);

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      if (mode === 'chat') {
        setSelectedUsers([userId]);
      } else {
        setSelectedUsers([...selectedUsers, userId]);
      }
    }
  };

  const handleSendFriendRequest = async (user: SearchUser) => {
    setSendingRequest(user.id);
    try {
      await sendFriendRequest(user.id);
      // Update local state to reflect sent request
      setSearchResults(prev =>
        prev.map(u => u.id === user.id ? { ...u, friendshipStatus: 'pending_sent' as FriendshipStatus } : u)
      );
      Alert.alert('Sent', `Friend request sent to ${user.name}`);
    } catch {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleDone = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No users selected', 'Please select at least one user.');
      return;
    }

    if (mode === 'event' || mode === 'calendar') {
      router.back();
      setTimeout(() => {
        router.setParams({ selectedUsers: JSON.stringify(selectedUsers) });
      }, 100);
    } else if (mode === 'chat') {
      const selectedUser = searchResults.find(u => u.id === selectedUsers[0]);
      if (selectedUser) {
        try {
          const chat = await createDmChat(selectedUser.id);
          router.replace({
            pathname: '/chat-detail',
            params: {
              id: chat.id,
              name: selectedUser.name,
              type: 'direct',
              userId: selectedUser.id,
            },
          });
        } catch {
          Alert.alert('Error', 'Failed to create conversation');
        }
      }
    } else {
      Alert.alert(
        'Success',
        `Added ${selectedUsers.length} user(s)`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const getFriendshipLabel = (status: FriendshipStatus) => {
    switch (status) {
      case 'friends': return 'Friends';
      case 'pending_sent': return 'Request Sent';
      case 'pending_received': return 'Pending';
      default: return null;
    }
  };

  const renderUser = ({ item }: { item: SearchUser }) => {
    const isSelected = selectedUsers.includes(item.id);
    const friendLabel = getFriendshipLabel(item.friendshipStatus);

    return (
      <Pressable
        style={[
          styles.userItem,
          { backgroundColor: surfaceColor, borderColor },
          isSelected && { borderColor: tintColor, borderWidth: 2 },
        ]}
        onPress={() => {
          if (mode === 'friend') {
            // In friend mode, tapping sends a friend request (if not already friends/pending)
            if (item.friendshipStatus === 'none') {
              handleSendFriendRequest(item);
            }
          } else {
            toggleUserSelection(item.id);
          }
        }}
      >
        <View style={[styles.avatar, { backgroundColor: tintColor + '20', borderColor: tintColor }]}>
          <ThemedText style={[styles.avatarText, { color: tintColor }]}>
            {item.name.charAt(0)}
          </ThemedText>
        </View>
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
          <ThemedText style={[styles.userUsername, { color: textSecondary }]}>
            @{item.username}
          </ThemedText>
          <ThemedText style={[styles.userEmail, { color: textSecondary }]}>
            {item.email}
          </ThemedText>
        </View>
        {/* Friendship status badge */}
        {friendLabel && (
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: item.friendshipStatus === 'friends'
                ? successColor + '20'
                : tintColor + '20',
              borderColor: item.friendshipStatus === 'friends'
                ? successColor
                : tintColor,
            },
          ]}>
            <ThemedText style={[
              styles.statusText,
              {
                color: item.friendshipStatus === 'friends'
                  ? successColor
                  : tintColor,
              },
            ]}>
              {friendLabel}
            </ThemedText>
          </View>
        )}
        {/* Friend mode: Add button for non-friends */}
        {mode === 'friend' && item.friendshipStatus === 'none' && (
          sendingRequest === item.id ? (
            <ActivityIndicator size="small" color={tintColor} />
          ) : (
            <Pressable
              style={[styles.addFriendButton, { backgroundColor: tintColor }]}
              onPress={() => handleSendFriendRequest(item)}
            >
              <IconSymbol name="plus" size={16} color="#FFFFFF" />
            </Pressable>
          )
        )}
        {/* Chat/event mode: checkmark for selected */}
        {mode !== 'friend' && isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={24} color={tintColor} />
        )}
        {/* Chat mode: show "Message Request" label for non-friends */}
        {mode === 'chat' && !isSelected && item.friendshipStatus !== 'friends' && item.friendshipStatus !== 'none' ? null : null}
      </Pressable>
    );
  };

  const getTitle = () => {
    switch (mode) {
      case 'calendar': return 'Add Members';
      case 'friend': return 'Add Friend';
      case 'chat': return 'New Message';
      default: return 'Add People';
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="xmark" size={24} color={tintColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          {getTitle()}
        </ThemedText>
        {mode !== 'friend' ? (
          <Pressable
            onPress={handleDone}
            style={[styles.doneButton, { backgroundColor: tintColor }]}
            disabled={selectedUsers.length === 0}
          >
            <ThemedText style={styles.doneText}>Done</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.doneButton} />
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: surfaceColor }]}>
        <IconSymbol name="person.fill" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: useThemeColor({}, 'text') }]}
          placeholder="Search by username, name, or email..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator size="small" color={tintColor} />}
      </View>

      {/* Selected Count (non-friend modes) */}
      {mode !== 'friend' && selectedUsers.length > 0 && (
        <View style={[styles.selectedBanner, { backgroundColor: tintColor + '20' }]}>
          <ThemedText style={[styles.selectedText, { color: tintColor }]}>
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </ThemedText>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={searchResults}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.fill" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {searchQuery ? (isSearching ? 'Searching...' : 'No users found') : 'Start typing to search'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectedBanner: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userUsername: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addFriendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
