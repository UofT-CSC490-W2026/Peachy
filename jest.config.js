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
      '|expo-av' +
    ')/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '@react-native-async-storage/async-storage': require.resolve('@react-native-async-storage/async-storage/jest/async-storage-mock'),
    '^expo-symbols$': '<rootDir>/__mocks__/expo-symbols.tsx',
    '^expo-av$': '<rootDir>/__mocks__/expo-av.tsx',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
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
    '!utils/ai-parser.ts',                         // mock stub, no real logic
    '!utils/api-client.ts',                        // HTTP client, needs integration tests
    '!utils/audio-transcribe.ts',                  // AWS Transcribe HTTP pipeline, needs integration tests
    '!utils/notifications.ts',                     // native push API, untestable in Jest
    '!components/ui/**',                           // native icon primitives (SF Symbols)
    '!components/haptic-tab.tsx',                  // native haptics, untestable in Jest
    '!components/availability-viewer.tsx',         // needs CalendarContext + live API
    '!components/pending-items.tsx',               // needs CalendarContext + router integration
    '!components/calendar/time-grid.tsx',          // 24h pixel-positioned grid, visual only
    '!components/calendar/month-view.tsx',         // full calendar grid, visual only
    '!components/calendar/week-view.tsx',          // full calendar grid, visual only
    '!components/calendar/day-view.tsx',           // full calendar grid, visual only
    '!components/calendar/month-day-cell.tsx',     // pixel-positioned cell, visual only
    '!components/calendar/event-block.tsx',        // pixel-positioned block, visual only
    '!components/calendar/upcoming-events.tsx',    // needs CalendarContext
    '!components/calendar/event-list.tsx',         // needs CalendarContext
    '!components/calendar/calendar-filter-bar.tsx',// needs CalendarContext
    '!components/form/form-date-picker.tsx',       // native date/time picker, untestable in Jest
    '!hooks/use-color-scheme.web.ts',              // web-only hydration hook
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
};

module.exports = config;
