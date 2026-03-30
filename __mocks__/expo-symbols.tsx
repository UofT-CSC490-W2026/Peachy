import React from 'react';
import { View } from 'react-native';

export function SymbolView({ testID }: { name?: string; testID?: string; [key: string]: unknown }) {
  return <View testID={testID ?? 'symbol-view'} />;
}

export type SymbolViewProps = object;
export type SymbolWeight = string;
