import { StyleSheet, ScrollView, View, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FormField } from '@/components/form/form-field';
import { FormTextInput } from '@/components/form/form-text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { useInterests } from '@/hooks/use-interests';
import { INTEREST_CATEGORIES } from '@/constants/interests';
import { createApiClient, ApiError } from '@/utils/api-client';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

interface AvatarUploadUrlResponse {
  uploadUrl: string;
  avatarUrl: string;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateUser, fetchProfile, getIdToken } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const { selected, toggle } = useInterests(user?.interests);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        username: username.trim(),
        interests: [...selected],
      });
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert('Error', 'Username already taken');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    // Client-side file size check
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE) {
      Alert.alert('Error', 'Image must be smaller than 5MB');
      return;
    }

    // Use expo-image-picker's mimeType when available; reject unsupported types
    const mimeType = asset.mimeType ?? '';
    let contentType: 'image/jpeg' | 'image/png';
    if (mimeType === 'image/png') {
      contentType = 'image/png';
    } else if (mimeType === 'image/jpeg' || mimeType === '') {
      // Default to JPEG for unknown/missing MIME (common on Android)
      contentType = 'image/jpeg';
    } else {
      Alert.alert('Error', 'Only JPEG and PNG images are supported');
      return;
    }

    setIsUploading(true);
    try {
      const apiClient = createApiClient(getIdToken);
      const { uploadUrl, avatarUrl: newAvatarUrl } = await apiClient.get<AvatarUploadUrlResponse>(
        `/users/me/avatar/upload-url?contentType=${encodeURIComponent(contentType)}`
      );

      // Upload image to S3 via presigned URL
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      const uploadResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });

      if (!uploadResp.ok) {
        throw new Error('Upload failed');
      }

      // Confirm avatar URL in DynamoDB after successful upload
      await updateUser({ avatarUrl: newAvatarUrl } as any);
    } catch {
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={tintColor} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Edit Profile
        </ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={[styles.avatarImage, { borderColor }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: surfaceColor, borderColor }]}>
              <ThemedText type="title">{name.charAt(0).toUpperCase()}</ThemedText>
            </View>
          )}
          {isUploading ? (
            <ActivityIndicator style={styles.changePhotoButton} color={tintColor} />
          ) : (
            <Pressable style={styles.changePhotoButton} onPress={handleChangePhoto}>
              <ThemedText style={[styles.changePhotoText, { color: tintColor }]}>
                Change Photo
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Name Field */}
        <FormField label="Name" required>
          <FormTextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
        </FormField>

        {/* Username Field */}
        <FormField label="Username" required>
          <FormTextInput
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            autoCapitalize="none"
          />
        </FormField>

        {/* Email Field (read-only) */}
        <FormField label="Email">
          <FormTextInput
            value={user?.email ?? ''}
            onChangeText={() => {}}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </FormField>

        {/* Info Text */}
        <View style={styles.infoBox}>
          <ThemedText style={[styles.infoText, { color: textSecondary }]}>
            Your name and username are visible to other users in shared calendars and events. Email cannot be changed here.
          </ThemedText>
        </View>

        {/* Interests */}
        <View style={styles.interestsSection}>
          <ThemedText style={[styles.interestsHeading, { color: textSecondary }]}>INTERESTS</ThemedText>
          {INTEREST_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.interestCategory}>
              <ThemedText style={[styles.interestCategoryLabel, { color: textSecondary }]}>
                {category.label}
              </ThemedText>
              <View style={styles.tagsWrap}>
                {category.tags.map((tag) => {
                  const isSelected = selected.has(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[
                        styles.tag,
                        isSelected
                          ? { backgroundColor: tintColor, borderColor: tintColor }
                          : { backgroundColor: surfaceColor, borderColor },
                      ]}
                      onPress={() => toggle(tag.id)}
                    >
                      <ThemedText
                        style={[styles.tagLabel, { color: isSelected ? '#fff' : textColor }]}
                      >
                        {tag.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.button, styles.cancelButton, { borderColor }]}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.button, styles.saveButton, { backgroundColor: tintColor, opacity: isSaving ? 0.6 : 1 }]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                Save Changes
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: 12,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    //
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  interestsSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  interestsHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  interestCategory: {
    marginBottom: 16,
  },
  interestCategoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
