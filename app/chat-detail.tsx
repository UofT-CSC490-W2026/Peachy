import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCalendar } from '@/contexts/calendar-context';
import { ChatMessage } from '@/types';
import { currentUser, contacts } from '@/data/mock-data';

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = params.id as string || 'chat-1';
  const chatName = params.name as string || 'Chat';
  const chatType = params.type as string || 'direct';

  const { getChatMessages, pendingItems, acceptPendingItem, declinePendingItem } = useCalendar();

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const successColor = useThemeColor({}, 'success');

  // Get messages from context and add mock conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Get messages from context and add some mock conversation data for demo
    const contextMessages = getChatMessages(chatId);
    const mockConversation: ChatMessage[] = [
      ...contextMessages,
      {
        id: 'msg-conv-1',
        chatId,
        senderId: currentUser.id,
        content: 'Thanks for the reminder!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        readBy: ['user-2', currentUser.id],
      },
      {
        id: 'msg-conv-2',
        chatId,
        senderId: 'user-2',
        content: 'No problem! See you there.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        readBy: ['user-2'],
      },
    ];
    setMessages(mockConversation);
  }, [chatId, getChatMessages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: 'chat-1',
      senderId: currentUser.id,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id],
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) return currentUser.name;
    const contact = contacts.find(c => c.id === userId);
    return contact?.name || 'Unknown';
  };

  const handleViewEvent = (eventId: string) => {
    router.push({
      pathname: '/event-detail',
      params: { id: eventId },
    });
  };

  const handleAcceptInvite = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message?.eventId) return;

    // Find the matching pending item by eventId to get its itemId
    const pendingItem = pendingItems.find(i => i.eventId === message.eventId && i.status === 'pending');

    // Update local state for immediate UI feedback
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, inviteStatus: 'accepted' as const } : msg
    ));

    if (pendingItem) {
      try {
        await acceptPendingItem(pendingItem.id);
        Alert.alert('Success', 'Event invitation accepted');
      } catch {
        // Revert local message state
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, inviteStatus: 'pending' as const } : msg
        ));
        Alert.alert('Error', 'Failed to accept invitation. Please try again.');
      }
    } else {
      Alert.alert('Success', 'Event invitation accepted');
    }
  };

  const handleDeclineInvite = async (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message?.eventId) return;

    const pendingItem = pendingItems.find(i => i.eventId === message.eventId && i.status === 'pending');

    // Update local state for immediate UI feedback
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, inviteStatus: 'declined' as const } : msg
    ));

    if (pendingItem) {
      try {
        await declinePendingItem(pendingItem.id);
        Alert.alert('Declined', 'Event invitation declined');
      } catch {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, inviteStatus: 'pending' as const } : msg
        ));
        Alert.alert('Error', 'Failed to decline invitation. Please try again.');
      }
    } else {
      Alert.alert('Declined', 'Event invitation declined');
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.senderId === currentUser.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showHeader = !prevMessage || prevMessage.senderId !== item.senderId;
    const isEventInvite = item.type === 'event_invite';
    const inviteStatus = item.inviteStatus || 'pending';
    const showActions = isEventInvite && !isCurrentUser && inviteStatus === 'pending';

    // Event invite messages use a card design (similar to pending items)
    if (isEventInvite) {
      return (
        <View style={styles.messageContainer}>
          {showHeader && !isCurrentUser && (
            <ThemedText style={[styles.senderName, { color: textSecondary }]}>
              {getUserName(item.senderId)}
            </ThemedText>
          )}
          <Pressable
            style={[styles.eventInviteCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => item.eventId && handleViewEvent(item.eventId)}
          >
            <View style={styles.eventInviteContent}>
              <View style={[styles.eventIconContainer, { backgroundColor: tintColor + '15' }]}>
                <IconSymbol name="bell" size={20} color={tintColor} />
              </View>
              <View style={styles.eventTextContent}>
                <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                  {item.content}
                </ThemedText>
                <ThemedText style={[styles.eventSubtitle, { color: textSecondary }]}>
                  {isCurrentUser ? 'You sent an event invitation' : `${getUserName(item.senderId)} invited you`}
                </ThemedText>
              </View>
            </View>

            {inviteStatus !== 'pending' && (
              <View style={[
                styles.statusBadge,
                inviteStatus === 'accepted'
                  ? { backgroundColor: successColor + '15', borderColor: successColor }
                  : { backgroundColor: dangerColor + '15', borderColor: dangerColor }
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  inviteStatus === 'accepted' ? { color: successColor } : { color: dangerColor }
                ]}>
                  {inviteStatus === 'accepted' ? 'Accepted' : 'Declined'}
                </ThemedText>
              </View>
            )}

            {showActions && (
              <View style={styles.inviteActions}>
                <Pressable
                  style={[styles.inviteButton, styles.declineButton, { borderColor: dangerColor }]}
                  onPress={() => handleDeclineInvite(item.id)}
                >
                  <ThemedText style={[styles.inviteButtonText, { color: dangerColor }]}>
                    Decline
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.inviteButton, styles.acceptButton, { backgroundColor: tintColor }]}
                  onPress={() => handleAcceptInvite(item.id)}
                >
                  <ThemedText style={[styles.inviteButtonText, { color: '#FFFFFF' }]}>
                    Accept
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </Pressable>
        </View>
      );
    }

    // Regular text messages
    return (
      <View style={[styles.messageContainer, isCurrentUser && styles.messageContainerRight]}>
        {showHeader && !isCurrentUser && (
          <ThemedText style={[styles.senderName, { color: textSecondary }]}>
            {getUserName(item.senderId)}
          </ThemedText>
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser
              ? { backgroundColor: tintColor }
              : { backgroundColor: surfaceColor, borderColor, borderWidth: 1 },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isCurrentUser && styles.messageTextSent,
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              isCurrentUser ? styles.messageTimeSent : { color: textSecondary },
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const handleAddPeople = () => {
    router.push({
      pathname: '/user-search',
      params: { mode: 'chat', chatId: params.id || 'chat-1' },
    });
  };

  return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <View style={styles.headerContent}>
            <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
              {chatName}
            </ThemedText>
            {chatType === 'calendar_group' && (
              <ThemedText style={[styles.headerSubtitle, { color: textSecondary }]}>
                Calendar Group
              </ThemedText>
            )}
          </View>
          <Pressable onPress={handleAddPeople} style={styles.addButton}>
            <IconSymbol name="person.2" size={24} color={tintColor} />
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
        />

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: useThemeColor({}, 'text') }]}
            placeholder="Type a message..."
            placeholderTextColor={textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? tintColor : surfaceColor },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <IconSymbol
              name="arrow.up.circle.fill"
              size={32}
              color={inputText.trim() ? '#FFFFFF' : textSecondary}
            />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  eventInviteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  eventInviteContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  eventTextContent: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 15,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  eventSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {
    // backgroundColor set via tintColor
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextSent: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
  },
});
