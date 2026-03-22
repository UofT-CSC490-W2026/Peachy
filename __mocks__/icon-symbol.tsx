import React from 'react';
import { View } from 'react-native';

export function IconSymbol({ testID }: { name?: string; size?: number; color?: string; testID?: string }) {
  return <View testID={testID ?? 'icon-symbol'} />;
}
