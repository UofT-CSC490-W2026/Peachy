import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useChat } from '@/contexts/chat-context';
import { useCalendar } from '@/contexts/calendar-context';

export default function ChatScreen() {
  const router = useRouter();
  const { chats, messageRequests, requestCount, isLoading, refreshChats } = useChat();
  const { calendars } = useCalendar();
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const dangerColor = useThemeColor({}, 'danger');

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getCalendarColor = (calendarId?: string) => {
    if (!calendarId) return undefined;
    const calendar = calendars.find((cal: any) => cal.id === calendarId);
    return calendar?.color;
  };

  const renderChat = ({ item }: { item: any }) => {
    const calendarColor = getCalendarColor(item.calendarId);

    return (
      <Pressable
        style={[styles.chatItem, { backgroundColor: surfaceColor, borderColor }]}
        onPress={() => {
          router.push({
            pathname: '/chat-detail',
            params: { id: item.id, name: item.name, type: item.type },
          });
        }}
      >
        <View style={styles.chatIcon}>
          {item.type === 'calendar_group' && calendarColor && (
            <View style={[styles.calendarDot, { backgroundColor: calendarColor }]} />
          )}
          <IconSymbol
            name={item.type === 'calendar_group' ? 'person.2' : 'bubble.left.fill'}
            size={24}
            color={tintColor}
          />
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <ThemedText type="defaultSemiBold" style={styles.chatName}>
              {item.name}
            </ThemedText>
            {item.lastMessageTime && (
              <ThemedText style={[styles.timestamp, { color: textSecondary }]}>
                {formatTime(item.lastMessageTime)}
              </ThemedText>
            )}
          </View>
          {item.lastMessage && (
            <View style={styles.messageRow}>
              <ThemedText
                style={[styles.lastMessage, { color: textSecondary }]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </ThemedText>
              {item.unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: tintColor }]}>
                  <ThemedText style={styles.badgeText}>
                    {item.unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const calendarChats = chats.filter(chat => chat.type === 'calendar_group');
  const directChats = chats.filter(chat => chat.type === 'direct');

  const handleNewChat = () => {
    router.push({
      pathname: '/user-search',
      params: { mode: 'chat' },
    });
  };

  const renderSectionHeader = (title: string, badge?: number) => (
    <View style={styles.sectionHeaderRow}>
      <ThemedText style={[styles.sectionHeader, { color: textSecondary }]}>
        {title}
      </ThemedText>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.sectionBadge, { backgroundColor: dangerColor }]}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      )}
    </View>
  );

  const allItems = [
    ...(requestCount > 0 ? [{ type: 'header', title: 'MESSAGE REQUESTS', badge: requestCount }] : []),
    ...messageRequests,
    ...(calendarChats.length > 0 ? [{ type: 'header', title: 'CALENDAR CHATS' }] : []),
    ...calendarChats,
    ...(directChats.length > 0 ? [{ type: 'header', title: 'DIRECT MESSAGES' }] : []),
    ...directChats,
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Chat</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={handleNewChat}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      <FlatList
        data={allItems}
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'header') {
            return renderSectionHeader(item.title, (item as any).badge);
          }
          return renderChat({ item });
        }}
        keyExtractor={(item, index) => 'type' in item && item.type === 'header' ? `header-${index}` : (item as any).id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshChats} tintColor={tintColor} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="bubble.left.fill" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No conversations yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textSecondary }]}>
              Chat with calendar members to coordinate events
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 140, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
