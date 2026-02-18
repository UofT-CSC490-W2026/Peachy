import { StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'google';
}

export function AuthButton({ title, onPress, loading, variant = 'primary' }: AuthButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: tintColor },
        variant === 'outline' && { borderWidth: 1, borderColor },
        variant === 'google' && { borderWidth: 1, borderColor },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : tintColor} />
      ) : (
        <View style={styles.content}>
          {variant === 'google' && (
            <ThemedText style={[styles.googleIcon, { color: textColor }]}>G</ThemedText>
          )}
          <ThemedText
            style={[
              styles.buttonText,
              variant === 'primary' && { color: '#FFFFFF' },
              (variant === 'outline' || variant === 'google') && { color: textColor },
            ]}
          >
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
