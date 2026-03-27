# Peachy Calendar App

[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/cyn900/d68af45e32e37603d0b690f9ef315fdd/raw/peachy-coverage.json)](https://github.com/YOUR_ORG/YOUR_REPO/actions)

Intelligent mobile calendar with natural-language scheduling, shared calendars, and integrated messaging. Built with React Native (Expo) + AWS Serverless.

## Quick Start

**Requirements:** Node.js 20+ (required for Expo SDK 54 and React Native 0.81)

```bash
npm install
npx expo start
```

**Note:** Environment files (`.env.development`, `.env.production`) already exist but are minimal. Add backend environment variables later when you implement AWS infrastructure.

In the output, you'll find options to open the app in a:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

**Other commands:**

```bash
npm run ios         # iOS simulator (dev environment)
npm run android     # Android emulator (dev environment)
npm run web         # Web browser (dev environment)
npm run lint        # Run ESLint

# Testing
npm test                # Run all unit tests
npm run test:watch      # Run tests in watch mode (re-runs on file save)
npm run test:coverage   # Run tests with coverage report

# Production environment
npm run start:prod
npm run ios:prod
npm run android:prod
npm run web:prod
```

## Project Structure

```
Peachy/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── index.tsx             # Home: Pending items + upcoming events
│   │   ├── calendars.tsx         # Calendars: Grid views + management
│   │   ├── chat.tsx              # Chat: Conversations list
│   │   └── profile.tsx           # Profile: Settings
│   ├── _layout.tsx               # Root layout (providers, navigation)
│   ├── event-create.tsx          # Modal: Create event
│   ├── event-detail.tsx          # Modal: View event
│   ├── event-edit.tsx            # Modal: Edit event
│   ├── calendar-create.tsx       # Modal: Create calendar
│   ├── calendar-settings.tsx     # Modal: Manage calendar
│   ├── chat-detail.tsx           # Modal: Chat conversation
│   ├── user-search.tsx           # Modal: Search users
│   └── profile-edit.tsx          # Modal: Edit profile
│
├── components/
│   ├── calendar/                 # 13 calendar components
│   │   ├── month-view.tsx        # 6×7 grid
│   │   ├── week-view.tsx         # 7-column time grid
│   │   ├── day-view.tsx          # 1-column time grid
│   │   ├── time-grid.tsx         # Shared 24-hour grid
│   │   ├── event-block.tsx       # Positioned event on grid
│   │   ├── event-card.tsx        # Event card for lists
│   │   └── ...                   # 7 more calendar components
│   ├── form/                     # 5 form components
│   │   ├── form-text-input.tsx
│   │   ├── form-switch-row.tsx
│   │   └── ...
│   ├── ui/                       # UI primitives
│   │   ├── icon-symbol.tsx       # Cross-platform icons
│   │   └── icon-symbol.ios.tsx   # SF Symbols (iOS)
│   ├── themed-text.tsx           # Theme-aware text
│   ├── themed-view.tsx           # Theme-aware view
│   ├── pending-items.tsx         # Pending invitations
│   ├── availability-viewer.tsx   # Conflict checker
│   └── ai-input-bar.tsx          # AI scheduling input
│
├── contexts/
│   └── calendar-context.tsx      # React Context (temporary state)
│
├── types/
│   ├── calendar.ts               # Calendar, CalendarType
│   ├── event.ts                  # CalendarEvent, RecurrenceRule
│   ├── user.ts                   # User, RlPreferences
│   ├── chat.ts                   # Chat, ChatMessage
│   ├── pending.ts                # PendingItem
│   └── index.ts                  # Barrel export
│
├── utils/
│   ├── date-helpers.ts           # 16+ date utility functions
│   └── calendar-helpers.ts       # Calendar color mapping
│
├── data/
│   └── mock-data.ts              # Mock users, events, calendars, chats
│
├── constants/
│   └── theme.ts                  # Peachy pink palette + fonts
│
├── hooks/
│   ├── use-color-scheme.ts       # Theme detection
│   └── use-theme-color.ts        # Color resolver
│
├── config/
│   └── environment.ts            # Environment configuration (dev/prod)
│
├── assets/images/                # App icons + branding
│
├── __tests__/                    # Jest test files
│   ├── components/               # Component tests
│   ├── utils/                    # Utility unit tests
│   ├── test-utils.tsx            # Shared renderWithProviders() helper
│   └── tsconfig.json             # Jest type declarations
├── __mocks__/                    # Jest manual mocks
│   ├── expo-symbols.tsx          # Stub for SF Symbols native module
│   └── icon-symbol.tsx           # Stub for IconSymbol component
│
├── .github/workflows/
│   └── test.yml                  # CI/CD: run tests on push/PR to main or dev
│
├── CLAUDE.md                     # AI agent instructions (source of truth)
├── project.md                    # Full project spec
├── API_SPECIFICATION.md          # REST API endpoints (39 endpoints)
│
├── app.config.js                 # Expo configuration (dynamic, replaces app.json)
├── .env.development              # Dev environment variables (gitignored)
├── .env.production               # Prod environment variables (gitignored)
├── .env.example                  # Environment template (committed)
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── eslint.config.js              # ESLint (flat config)
```

## Tech Stack

- **Framework:** React Native (Expo SDK 54, React 19)
- **Routing:** Expo Router v6 (file-based)
- **Language:** TypeScript (strict mode)
- **Styling:** React Native StyleSheet (peachy pink theme)
- **State:** React Context (temporary - production library TBD)
- **Animations:** react-native-reanimated
- **Backend:** AWS Serverless (Lambda, DynamoDB, API Gateway, Cognito, ca-central-1 region) - **not yet implemented**
- **AI:** AWS Bedrock (Claude Haiku 4.5 + Sonnet 4.5) - **not yet implemented**
- **Environments:** Dev/prod configuration with separate bundle IDs for side-by-side installation

## Current Status

**Frontend:** ✅ Complete UI with all screens, calendar views, event management, chat, and peachy pink theme
**Backend:** ⏳ Not implemented (see API_SPECIFICATION.md for design)

## Environment Setup

The app supports separate **development** and **production** environments with different configurations.

### Environment Files

Environment files already exist but contain **minimal configuration**. Backend variables will be added when AWS infrastructure is implemented.

1. **`.env.example`** - Template (committed to git)
   - Shows structure for environment variables
   - Copy this when adding new environment variables

2. **`.env.development`** - Dev environment (gitignored)
   - Currently: `APP_ENV=development`
   - Future: API URLs, AWS Cognito pools, etc.
   - Bundle ID: `com.peachy.dev`
   - App name: "Peachy (Dev)"

3. **`.env.production`** - Production environment (gitignored)
   - Currently: `APP_ENV=production`
   - Future: Production API URLs, AWS resources
   - Bundle ID: `com.peachy.app`
   - App name: "Peachy"

4. **`.env.local`** - Local overrides (gitignored, optional)
   - Overrides `.env.development` for local testing
   - Example: Point to `http://localhost:3000` for local backend

### Configuration

Environment configuration is accessed via `config/environment.ts`:

```typescript
import env, { devLog } from '@/config/environment';

// AWS region (hardcoded)
console.log(env.awsRegion);  // 'ca-central-1'

// Environment type
console.log(env.appEnv);  // 'development' or 'production'

// Development-only logging
devLog('Event created:', event);  // Only logs in dev
```

**Adding Backend Environment Variables (when ready):**

1. **Add to `.env` files:**
   ```bash
   # .env.development
   APP_ENV=development
   API_URL=https://dev-api.peachy.app
   COGNITO_USER_POOL_ID=ca-central-1_XXXXXXXXX
   COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Pass through `app.config.js`:**
   ```javascript
   extra: {
     apiUrl: process.env.API_URL,
     cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
     // ...
   }
   ```

3. **Access in `config/environment.ts`:**
   ```typescript
   const env: Environment = {
     apiUrl: extra.apiUrl || '',
     cognitoUserPoolId: extra.cognitoUserPoolId || '',
     // ...
   };
   ```

**Note:** AWS region is hardcoded to `ca-central-1` in `config/environment.ts` for all resources.

### Building for Different Environments

**Development builds:**
```bash
npm start              # Dev environment, Expo Go
npm run ios            # Dev build on iOS
npm run android        # Dev build on Android
```

**Production builds:**
```bash
npm run start:prod     # Prod environment
npm run ios:prod       # Prod build on iOS
npm run android:prod   # Prod build on Android
```

**EAS Build (for distribution):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS project (first time only)
eas build:configure

# Build for internal testing
eas build --profile development --platform ios
eas build --profile preview --platform android

# Build for production
eas build --profile production --platform all
```

### What's Different Between Environments

| Feature | Development | Production |
|---------|-------------|------------|
| **App Name** | Peachy (Dev) | Peachy |
| **Bundle ID** | `com.peachy.dev` | `com.peachy.app` |
| **Default** | ✅ Default for `expo start` | Requires `APP_ENV=production` |
| **Logging** | Verbose (`devLog()` enabled) | Minimal (production-ready) |
| **Backend** | Future: Dev AWS resources | Future: Prod AWS resources |
| **Side-by-side** | ✅ Can install both apps | ✅ Can install both apps |

## Testing

**Jest 29** + **@testing-library/react-native** with `babel-preset-expo` for TypeScript transforms.

```bash
npm test                  # Run all tests (95 tests across 7 suites)
npm run test:watch        # Watch mode — re-runs affected tests on save
npm run test:coverage     # Coverage report (utils/ + components/)
```

Tests are organized by type in `__tests__/`:

```
__tests__/
  components/
    themed-text.test.tsx     # ThemedText — all types, testID passthrough
    themed-view.test.tsx     # ThemedView — children, testID, multiple children
    ai-input-bar.test.tsx    # AiInputBar — renders, initial value, input handling
  utils/
    date-helpers.test.ts     # Grid generation, formatting, event filtering
    validation.test.ts       # Email, password, name, and form validation
    calendar-helpers.test.ts # Calendar color mapping and fallback behavior
    rl-helpers.test.ts       # Thompson Sampling slot index formula
  test-utils.tsx             # Shared renderWithProviders() helper
  tsconfig.json              # Jest type declarations
```

**Writing component tests:** Use `renderWithProviders` from `../test-utils` instead of `@testing-library/react-native` directly — it wraps components in `ThemeProvider` which is required for theme hooks.

```tsx
import { renderWithProviders } from '../test-utils';
import { screen } from '@testing-library/react-native';
import { MyComponent } from '@/components/my-component';

it('renders correctly', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeTruthy();
});
```

**CI/CD:** Tests run automatically on push/PR to `main` or `dev` via GitHub Actions (`.github/workflows/test.yml`). Can also be triggered manually from the Actions tab. Coverage report is uploaded as a build artifact retained for 14 days.

## Key Files

- **`CLAUDE.md`** - AI agent instructions (always reference this first)
- **`project.md`** - Complete project specification
- **`API_SPECIFICATION.md`** - Backend API design

## Development

- Icons: Use `<IconSymbol>` component (SF Symbols on iOS, MaterialIcons elsewhere)
- Theme: Use `useThemeColor()` hook for dynamic colors
- Calendar colors: Use `getCalendarColor(id)` from `utils/calendar-helpers`
- Date operations: Use functions from `utils/date-helpers`
- Navigation: Expo Router handles routing via file structure

## Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
