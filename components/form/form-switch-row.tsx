import { StyleSheet, View, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FormSwitchRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function FormSwitchRow({ label, value, onValueChange }: FormSwitchRowProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: tintColor, false: undefined }}
        ios_backgroundColor="#E5E5E5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
  },
});
