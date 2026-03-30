import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useTheme } from '@/contexts/theme-context';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

const BASE_SIZES = {
  title: 32,
  subtitle: 20,
  default: 16,
  defaultSemiBold: 16,
  link: 16,
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({}, 'tint');
  const { fontScale } = useTheme();

  // Resolve the effective base font size: prefer inline fontSize from style if provided
  const flatStyle = StyleSheet.flatten(style);
  const baseSize = (flatStyle?.fontSize as number | undefined) ?? BASE_SIZES[type];
  const scaledSize = Math.round(baseSize * fontScale);
  // Scale lineHeight proportionally if provided inline, otherwise use type default
  const baseLineHeight = flatStyle?.lineHeight as number | undefined;
  const scaledLineHeight = baseLineHeight != null ? Math.round(baseLineHeight * fontScale) : undefined;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: linkColor }] : undefined,
        style,
        { fontSize: scaledSize },
        scaledLineHeight != null ? { lineHeight: scaledLineHeight } : undefined,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    lineHeight: 24,
  },
  defaultSemiBold: {
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
  },
});
