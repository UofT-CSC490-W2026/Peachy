import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { FormTextInput } from '@/components/form/form-text-input';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { TextInputProps } from 'react-native';

interface AuthTextInputProps extends TextInputProps {
  error?: string | null;
  showToggle?: boolean;
}

export function AuthTextInput({ error, style, showToggle, secureTextEntry, ...props }: AuthTextInputProps) {
  const dangerColor = useThemeColor({}, 'danger');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <View style={styles.inputRow}>
        <FormTextInput
          style={[
            error ? { borderColor: dangerColor } : undefined,
            showToggle ? styles.inputWithToggle : undefined,
            style,
          ]}
          secureTextEntry={showToggle ? !visible : secureTextEntry}
          {...props}
        />
        {showToggle && (
          <Pressable
            onPress={() => setVisible(v => !v)}
            style={[styles.toggleButton, { borderColor: error ? dangerColor : 'transparent' }]}
            hitSlop={8}
          >
            <ThemedText style={[styles.toggleText, { color: textSecondary }]}>
              {visible ? 'Hide' : 'Show'}
            </ThemedText>
          </Pressable>
        )}
      </View>
      {error && (
        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithToggle: {
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
});
