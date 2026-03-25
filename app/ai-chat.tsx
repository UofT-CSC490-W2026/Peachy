import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import Constants from 'expo-constants';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export default function AiChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getIdToken } = useAuth();

  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm Peachy, your calendar assistant. I can help you plan events, manage your schedule, or brainstorm ideas. What's on your mind?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const apiUrl = extra.apiUrl;

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsSending(true);

    // Build history from previous messages (exclude welcome + loading)
    const history = messages
      .filter(m => m.id !== 'welcome' && !m.isLoading)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const idToken = await getIdToken();
      if (!idToken || !apiUrl) {
        throw new Error('Not authenticated or API URL missing');
      }

      const res = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, id: `assistant-${Date.now()}`, content: data.message, isLoading: false }
            : m
        )
      );
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, id: `error-${Date.now()}`, content: `Sorry, something went wrong: ${err.message}`, isLoading: false }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages, getIdToken, apiUrl]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    if (item.isLoading) {
      return (
        <View style={[styles.messageContainer]}>
          <View style={[styles.messageBubble, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
            <ActivityIndicator size="small" color={tintColor} />
          </View>
        </View>
      );
    }

    const isError = item.id.startsWith('error-');

    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerRight]}>
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: tintColor + '20' }]}>
            <ThemedText style={[styles.avatarText, { color: tintColor }]}>P</ThemedText>
          </View>
        )}
        <View style={styles.bubbleWrapper}>
          <View
            style={[
              styles.messageBubble,
              isUser
                ? { backgroundColor: tintColor }
                : { backgroundColor: surfaceColor, borderColor, borderWidth: 1 },
            ]}
          >
            <ThemedText
              style={[
                styles.messageText,
                isUser && styles.messageTextSent,
                isError && { color: dangerColor },
              ]}
            >
              {item.content}
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.messageTime,
              isUser ? styles.messageTimeRight : {},
              { color: textSecondary },
            ]}
          >
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor, paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={tintColor} />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={[styles.headerAvatar, { backgroundColor: tintColor + '20' }]}>
              <ThemedText style={[styles.headerAvatarText, { color: tintColor }]}>P</ThemedText>
            </View>
            <View>
              <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                Peachy AI
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: textSecondary }]}>
                Calendar Assistant
              </ThemedText>
            </View>
          </View>
          <View style={styles.backButton} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: borderColor + '40' }]}
            placeholder="Ask Peachy anything..."
            placeholderTextColor={textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            editable={!isSending}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isSending ? tintColor : textSecondary + '30' },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            <IconSymbol
              name="arrow.up.circle.fill"
              size={32}
              color={inputText.trim() && !isSending ? '#FFFFFF' : textSecondary}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageContainerRight: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
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
    marginLeft: 4,
  },
  messageTimeRight: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButton: {
    borderRadius: 20,
    marginBottom: 2,
  },
});
