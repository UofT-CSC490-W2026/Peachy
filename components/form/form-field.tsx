import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
}

export function FormField({ label, children, required }: FormFieldProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.container}>
      <ThemedText
        style={styles.label}
        lightColor={textSecondary}
        darkColor={textSecondary}
      >
        {label}{required && ' *'}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
});
