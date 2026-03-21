/** @type {import('jest').Config} */
const config = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { presets: ['babel-preset-expo'] },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native' +
      '|@react-native' +
      '|@react-native-community' +
      '|expo' +
      '|expo-modules-core' +
      '|expo-router' +
      '|expo-constants' +
      '|@expo' +
    ')/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
  collectCoverageFrom: [
    'utils/**/*.ts',
    '!utils/ai-parser.ts',
    '!utils/api-client.ts',
  ],
};

module.exports = config;
