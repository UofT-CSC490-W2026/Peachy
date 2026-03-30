import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { useCalendar } from '@/contexts/calendar-context';
import { ApiError, AuthError } from '@/utils/api-client';
import type { AIParseResult } from '@/utils/ai-parser';
import { transcribeAudio } from '@/utils/audio-transcribe';
import { getSlotIndex } from '@/utils/rl-helpers';

interface AiInputBarProps {
  initialValue?: string;
}

export function AiInputBar({ initialValue }: AiInputBarProps = {}) {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { calendars, createEvent } = useCalendar();
  const [inputText, setInputText] = useState(initialValue ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const dangerColor = useThemeColor({}, 'danger');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setIsLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new AuthError();

      const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
      const apiUrl = (extra.apiUrl ?? '').replace(/\/$/, '');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(`${apiUrl}/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inputText: trimmedInput, timezone }),
      });

      if (response.status === 401) throw new AuthError();
      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
          const errorBody = await response.json() as Record<string, unknown>;
          if (typeof errorBody.message === 'string') message = errorBody.message;
        } catch { /* ignore */ }
        throw new ApiError(message, response.status);
      }

      const parsed = await response.json() as AIParseResult;
      const data = parsed.extractedData;

      if (calendars.length === 0) {
        Alert.alert('No Calendar', 'Please create a calendar first before using AI scheduling.');
        return;
      }

      // Warn about unresolved @mentions before creating the event
      const unresolved = (parsed as any).unresolvedMentions as Array<{ username: string }> | undefined;
      if (unresolved && unresolved.length > 0) {
        const names = unresolved.map((m: { username: string }) => `@${m.username}`).join(', ');
        await new Promise<void>(resolve =>
          Alert.alert(
            'Some people couldn\'t be added',
            `${names} ${unresolved.length === 1 ? 'is' : 'are'} not in your contacts. The event will be created without them.`,
            [{ text: 'OK', onPress: resolve }],
          )
        );
      }

      // If user has multiple calendars, let them pick; otherwise use the only one
      const calendarId = await new Promise<string | null>(resolve => {
        if (calendars.length === 1) {
          resolve(calendars[0].id);
          return;
        }
        Alert.alert(
          'Add to Calendar',
          'Which calendar should this event be added to?',
          [
            ...calendars.map(cal => ({ text: cal.name, onPress: () => resolve(cal.id) })),
            { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
          ],
        );
      });

      if (!calendarId) return; // user cancelled

      // RL feedback is sent regardless of whether event creation succeeds,
      // so the model always learns what time the user accepted.
      const suggestedSlotIndex = data.startTime ? getSlotIndex(new Date(data.startTime)) : null;
      const sendRlFeedback = () => {
        if (user && suggestedSlotIndex !== null) {
          fetch(`${apiUrl}/users/${encodeURIComponent(user.id)}/rl/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'accept', suggestedSlotIndex }),
          }).catch(() => {});
        }
      };

      try {
        await createEvent(calendarId, {
          title: data.title || 'Untitled Event',
          startTime: data.startTime,
          endTime: data.endTime,
          isAllDay: data.isAllDay ?? false,
          timezone,
          ...(data.location ? { location: data.location } : {}),
          invitedUserIds: data.invitedUserIds || [],
          aiGenerated: true,
          aiInput: trimmedInput,
          aiSuggested: parsed,
        });
        sendRlFeedback();
      } catch (createErr) {
        sendRlFeedback();
        throw createErr; // re-throw so outer catch shows the error alert
      }

      setInputText('');
      // Surface any AI ambiguities after creation so the user can review/edit
      if (parsed.ambiguities && parsed.ambiguities.length > 0) {
        Alert.alert(
          `"${data.title}" created`,
          `Heads up: ${parsed.ambiguities[0]}. Tap the event to review.`,
        );
      } else {
        Alert.alert('Event Created', `"${data.title}" has been added to your calendar.`);
      }
    } catch (err) {
      console.error('AI send error:', err);
      Alert.alert('Error', 'Could not create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice input.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    setIsRecording(false);
    setIsTranscribing(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');

      const transcript = await transcribeAudio(uri, getIdToken);
      if (transcript.trim()) {
        setInputText(prev => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
      } else {
        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
      }
    } catch (err) {
      if (err instanceof AuthError) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        Alert.alert('Transcription Failed', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [getIdToken]);

  const handleMic = useCallback(() => {
    if (isTranscribing || isLoading) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isTranscribing, isLoading, startRecording, stopRecording]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
      <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor: isRecording ? dangerColor : borderColor }]}>
        {isTranscribing ? (
          <ActivityIndicator size="small" color={tintColor} style={styles.micButton} />
        ) : (
          <Pressable onPress={handleMic} style={styles.micButton} disabled={isLoading}>
            <IconSymbol
              name={isRecording ? 'stop.fill' : 'mic.fill'}
              size={20}
              color={isRecording ? dangerColor : iconColor}
            />
          </Pressable>
        )}
        {isRecording ? (
          <ThemedText style={[styles.recordingText, { color: dangerColor }]}>
            Recording... tap stop when done
          </ThemedText>
        ) : (
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder={isTranscribing ? 'Transcribing...' : 'Schedule with AI...'}
            placeholderTextColor={iconColor}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline={false}
            editable={!isLoading && !isTranscribing}
          />
        )}
        {isLoading ? (
          <ActivityIndicator size="small" color={tintColor} style={styles.loader} />
        ) : (
          !isRecording && inputText.trim().length > 0 && (
            <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: tintColor }]} disabled={isTranscribing}>
              <IconSymbol name="arrow.up.circle.fill" size={28} color="#FFFFFF" />
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  micButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  recordingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  loader: {
    marginLeft: 4,
  },
});
