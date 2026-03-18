import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { ChatMessage } from '@/types';

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = params.id as string || '';
  const chatName = params.name as string || 'Chat';
  const chatType = params.type as string || 'direct';

  const { getChatMessages, sendMessage, markChatRead, acceptMessageRequest, messageRequests } = useChat();
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const successColor = useThemeColor({}, 'success');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Check if this is a message request
  const isMessageRequest = messageRequests.some(r => r.id === chatId);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    setIsLoadingMessages(true);
    try {
      const data = await getChatMessages(chatId);
      setMessages(data.messages.reverse()); // API returns newest first, we want oldest first
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [chatId, getChatMessages]);

  useEffect(() => {
    loadMessages();
    if (chatId) markChatRead(chatId);
  }, [chatId, loadMessages, markChatRead]);

  // Polling for new messages
  useEffect(() => {
    if (!chatId) return;
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [chatId, loadMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;

    const content = inputText.trim();
    setInputText('');

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const sent = await sendMessage(chatId, content, 'text');
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? sent : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptMessageRequest(chatId);
      Alert.alert('Accepted', 'Message request accepted');
    } catch (err) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const handleViewEvent = (eventId: string) => {
    router.push({
      pathname: '/event-detail',
      params: { id: eventId },
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showHeader = !prevMessage || prevMessage.senderId !== item.senderId;
    const isEventInvite = item.type === 'event_invite';
    const inviteStatus = item.inviteStatus || 'pending';

    if (isEventInvite) {
      return (
        <View style={styles.messageContainer}>
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
                  {isCurrentUser ? 'You sent an event invitation' : 'Event invitation'}
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
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isCurrentUser && styles.messageContainerRight]}>
        {showHeader && !isCurrentUser && chatType === 'calendar_group' && (
          <ThemedText style={[styles.senderName, { color: textSecondary }]}>
            {item.senderId}
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
      params: { mode: 'chat', chatId },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          <Pressable onPress={handleAddPeople} style={styles.addPeopleButton}>
            <IconSymbol name="person.2" size={24} color={tintColor} />
          </Pressable>
        </View>

        {/* Message Request Banner */}
        {isMessageRequest && (
          <View style={[styles.requestBanner, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
            <ThemedText style={styles.requestText}>
              {chatName} wants to message you
            </ThemedText>
            <View style={styles.requestActions}>
              <Pressable
                style={[styles.requestButton, { borderColor: dangerColor }]}
                onPress={() => router.back()}
              >
                <ThemedText style={{ color: dangerColor, fontWeight: '600' }}>Decline</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.requestButton, { backgroundColor: tintColor }]}
                onPress={handleAcceptRequest}
              >
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>Accept</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
        />

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={[styles.input, { color: useThemeColor({}, 'text') }]}
            placeholder="Type a message..."
            placeholderTextColor={textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={5000}
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
  addPeopleButton: {
    padding: 8,
  },
  requestBanner: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  requestText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
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
