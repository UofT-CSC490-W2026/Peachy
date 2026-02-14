import { StyleSheet, View, TextInput, FlatList, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { User } from '@/types';
import { contacts } from '@/data/mock-data';

export default function UserSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string || 'chat'; // 'chat' or 'event'

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filter users based on search query
  const filteredUsers = contacts.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      // For chat mode, only allow selecting one user at a time
      if (mode === 'chat') {
        setSelectedUsers([userId]);
      } else {
        setSelectedUsers([...selectedUsers, userId]);
      }
    }
  };

  const handleDone = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No users selected', 'Please select at least one user to add.');
      return;
    }

    if (mode === 'event') {
      // Return to event creation with selected users
      router.back();
      // Pass selected users via params (in real app, use context or state management)
      setTimeout(() => {
        router.setParams({ selectedUsers: JSON.stringify(selectedUsers) });
      }, 100);
    } else if (mode === 'chat') {
      // Chat mode - navigate to new DM conversation
      const selectedUser = contacts.find(u => u.id === selectedUsers[0]);
      if (selectedUser) {
        router.replace({
          pathname: '/chat-detail',
          params: {
            id: `dm-${selectedUser.id}`,
            name: selectedUser.name,
            type: 'direct',
            userId: selectedUser.id,
          },
        });
      }
    } else {
      // Other modes - show success and go back
      Alert.alert(
        'Success',
        `Added ${selectedUsers.length} user(s)`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <Pressable
        style={[
          styles.userItem,
          { backgroundColor: surfaceColor, borderColor },
          isSelected && { borderColor: tintColor, borderWidth: 2 },
        ]}
        onPress={() => toggleUserSelection(item.id)}
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
        {isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={24} color={tintColor} />
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="xmark" size={24} color={tintColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          {mode === 'chat' ? 'New Message' : 'Add People'}
        </ThemedText>
        <Pressable
          onPress={handleDone}
          style={[styles.doneButton, { backgroundColor: tintColor }]}
          disabled={selectedUsers.length === 0}
        >
          <ThemedText style={styles.doneText}>Done</ThemedText>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: surfaceColor }]}>
        <IconSymbol name="person.fill" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: useThemeColor({}, 'text') }]}
          placeholder="Search by username, name, or email..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      {/* Selected Count */}
      {selectedUsers.length > 0 && (
        <View style={[styles.selectedBanner, { backgroundColor: tintColor + '20' }]}>
          <ThemedText style={[styles.selectedText, { color: tintColor }]}>
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </ThemedText>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.fill" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {searchQuery ? 'No users found' : 'Start typing to search'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
    </>
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
