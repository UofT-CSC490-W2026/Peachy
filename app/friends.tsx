import { StyleSheet, View, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useFriends } from '@/contexts/friends-context';
import { Friend } from '@/types';

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, isLoading, refreshFriends, removeFriend } = useFriends();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  const handleAddFriend = () => {
    router.push({
      pathname: '/user-search',
      params: { mode: 'friend' },
    });
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friend.userId);
            } catch {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable
      style={[styles.friendItem, { backgroundColor: surfaceColor, borderColor }]}
      onPress={() => router.push({ pathname: '/friend-profile', params: { userId: item.userId } })}
    >
      <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
        <ThemedText style={[styles.avatarText, { color: tintColor }]}>
          {item.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.friendInfo}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        <ThemedText style={[styles.username, { color: textSecondary }]}>
          @{item.username}
        </ThemedText>
      </View>
      <Pressable
        style={[styles.removeButton, { borderColor: dangerColor }]}
        onPress={() => handleRemoveFriend(item)}
      >
        <ThemedText style={[styles.removeText, { color: dangerColor }]}>Remove</ThemedText>
      </Pressable>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Friends ({friends.length})
        </ThemedText>
        <Pressable onPress={handleAddFriend} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color={tintColor} />
        </Pressable>
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshFriends} tintColor={tintColor} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No friends yet
            </ThemedText>
            <Pressable
              style={[styles.addFriendButton, { backgroundColor: tintColor }]}
              onPress={handleAddFriend}
            >
              <ThemedText style={styles.addFriendButtonText}>Add Friends</ThemedText>
            </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
  },
  addButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  addFriendButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
