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
    // Utilities — pure functions, fully testable
    'utils/**/*.ts',
    // Components — UI components testable with renderWithProviders
    'components/**/*.tsx',
    // Hooks — custom hooks with pure logic
    'hooks/**/*.ts',
    // Constants — exported values and mappings
    'constants/**/*.ts',

    // Exclusions — not unit-testable or covered elsewhere
    '!utils/ai-parser.ts',       // mock stub, no real logic
    '!utils/api-client.ts',      // HTTP client, needs integration tests
    '!utils/notifications.ts',   // native push API, untestable in Jest
    '!components/ui/**',         // native icon primitives (SF Symbols)
    '!hooks/use-color-scheme.web.ts', // web-only hydration hook
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
};

module.exports = config;
