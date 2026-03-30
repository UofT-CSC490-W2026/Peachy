/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#E6785C';
const tintColorDark = '#FF6B4A';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#626B72',
    background: '#F7F3F0',
    surface: '#FCFAF8',
    surfaceSecondary: '#F1E9E3',
    tint: tintColorLight,
    icon: '#626B72',
    tabIconDefault: '#626B72',
    tabIconSelected: tintColorLight,
    border: '#D7CEC8',
    borderLight: '#E6DDD6',
    danger: '#D45C5C',
    success: '#3F9C79',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151210',
    surface: '#1F1C1A',
    surfaceSecondary: '#2A2624',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#3A3634',
    borderLight: '#2A2624',
    danger: '#F87171',
    success: '#34D399',
  },
};

export const calendarColors = [
  '#FF8C6B', // Peach
  '#4A90E2', // Blue
  '#9B59B6', // Purple
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#E74C3C', // Red
  '#1ABC9C', // Teal
  '#E91E63', // Pink
];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
