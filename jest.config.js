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
      '|expo-symbols' +
    ')/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '@react-native-async-storage/async-storage': require.resolve('@react-native-async-storage/async-storage/jest/async-storage-mock'),
    '^expo-symbols$': '<rootDir>/__mocks__/expo-symbols.tsx',
  },
  testMatch: [
    '**/__tests__/**/*.{test,spec}.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/\\.expo/'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  coverageReporters: ['text', 'lcov', 'clover'],
  collectCoverageFrom: [
    'utils/**/*.ts',
    'components/**/*.tsx',
    '!utils/ai-parser.ts',
    '!utils/api-client.ts',
    '!components/ui/**',
    '!**/__tests__/**',
  ],
};

module.exports = config;
