import { StyleSheet, View } from 'react-native';
import { FormTextInput } from '@/components/form/form-text-input';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { TextInputProps } from 'react-native';

interface AuthTextInputProps extends TextInputProps {
  error?: string | null;
}

export function AuthTextInput({ error, style, ...props }: AuthTextInputProps) {
  const dangerColor = useThemeColor({}, 'danger');

  return (
    <View>
      <FormTextInput
        style={[error ? { borderColor: dangerColor } : undefined, style]}
        {...props}
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: dangerColor }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
});
