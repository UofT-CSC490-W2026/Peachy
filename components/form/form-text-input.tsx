import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export function FormTextInput(props: TextInputProps) {
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'textSecondary');

  return (
    <TextInput
      style={[
        styles.input,
        {
          color: textColor,
          backgroundColor: surfaceColor,
          borderColor,
        },
        props.multiline && styles.multiline,
        props.style,
      ]}
      placeholderTextColor={placeholderColor}
      {...props}
    />
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
});
