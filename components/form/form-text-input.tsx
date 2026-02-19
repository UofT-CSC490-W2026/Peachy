import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FormTextInputProps extends TextInputProps {
  error?: string | null;
  showToggle?: boolean;
}

export function FormTextInput({ error, showToggle, style, secureTextEntry, ...props }: FormTextInputProps) {
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [visible, setVisible] = useState(false);

  const inputStyle = [
    styles.input,
    { color: textColor, backgroundColor: surfaceColor, borderColor: error ? dangerColor : borderColor },
    props.multiline && styles.multiline,
    showToggle && styles.inputWithToggle,
    style,
  ];

  if (!showToggle && !error) {
    return (
      <TextInput
        style={inputStyle}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    );
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={inputStyle}
          placeholderTextColor={placeholderColor}
          secureTextEntry={showToggle ? !visible : secureTextEntry}
          {...props}
        />
        {showToggle && (
          <Pressable
            onPress={() => setVisible(v => !v)}
            style={styles.toggleButton}
            hitSlop={8}
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithToggle: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
