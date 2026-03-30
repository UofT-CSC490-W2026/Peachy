# Peachy Calendar App

**Test Coverage:**
[![Lines](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/cyn900/d68af45e32e37603d0b690f9ef315fdd/raw/peachy-coverage-lines.json)](https://github.com/UofT-CSC490-W2026/Peachy/actions)
[![Statements](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/cyn900/d68af45e32e37603d0b690f9ef315fdd/raw/peachy-coverage-statements.json)](https://github.com/UofT-CSC490-W2026/Peachy/actions)
[![Functions](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/cyn900/d68af45e32e37603d0b690f9ef315fdd/raw/peachy-coverage-functions.json)](https://github.com/UofT-CSC490-W2026/Peachy/actions)
[![Branches](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/cyn900/d68af45e32e37603d0b690f9ef315fdd/raw/peachy-coverage-branches.json)](https://github.com/UofT-CSC490-W2026/Peachy/actions)

Intelligent mobile calendar with natural-language scheduling, shared calendars, and integrated messaging. Built with React Native (Expo) + AWS Serverless.

## Quick Start

**Requirements:** Node.js 20+ (required for Expo SDK 54 and React Native 0.81)

```bash
npm install
npx expo start
```

**Note:** Copy `.env.example` to `.env.development` and fill in your AWS values (API URL, Cognito pool ID, client ID) before running.

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
│   ├── (auth)/                   # Auth flow screens
│   │   ├── _layout.tsx           # Auth layout
│   │   ├── login.tsx             # Login screen
│   │   ├── signup.tsx            # Sign up screen
│   │   ├── forgot-password.tsx   # Password reset
│   │   ├── verify.tsx            # Email verification
│   │   └── welcome.tsx           # Welcome / onboarding
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── index.tsx             # Home: Pending items + upcoming events
│   │   ├── calendars.tsx         # Calendars: Grid views + management
│   │   ├── chat.tsx              # Chat: Conversations list
│   │   └── profile.tsx           # Profile: Settings
│   ├── _layout.tsx               # Root layout (providers, navigation)
│   ├── ai-chat.tsx               # Modal: AI chat conversation
│   ├── appearance.tsx            # Modal: Appearance settings
│   ├── callback.tsx              # OAuth callback handler
│   ├── calendar-create.tsx       # Modal: Create calendar
│   ├── calendar-settings.tsx     # Modal: Manage calendar
│   ├── chat-detail.tsx           # Modal: Chat conversation
│   ├── chat-members.tsx          # Modal: Chat member list
│   ├── event-create.tsx          # Modal: Create event
│   ├── event-detail.tsx          # Modal: View event
│   ├── event-edit.tsx            # Modal: Edit event
│   ├── friend-profile.tsx        # Modal: View friend profile
│   ├── friends.tsx               # Modal: Friends list
│   ├── google-calendar-link.tsx  # Modal: Link Google Calendar
│   ├── google-calendar-prompt.tsx# Modal: Google Calendar prompt
│   ├── interests.tsx             # Modal: User interests selection
│   ├── profile-edit.tsx          # Modal: Edit profile
│   ├── settings.tsx              # Modal: App settings
│   └── user-search.tsx           # Modal: Search users
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
│   ├── auth/                     # Auth components
│   │   └── auth-button.tsx       # Themed auth button
│   ├── form/                     # 5 form components
│   │   ├── form-text-input.tsx
│   │   ├── form-switch-row.tsx
│   │   └── ...
│   ├── ui/                       # UI primitives
│   │   ├── icon-symbol.tsx       # Cross-platform icons
│   │   ├── icon-symbol.ios.tsx   # SF Symbols (iOS)
│   │   └── tab-icons.tsx         # Custom tab bar icons
│   ├── themed-text.tsx           # Theme-aware text
│   ├── themed-view.tsx           # Theme-aware view
│   ├── pending-items.tsx         # Pending invitations
│   ├── availability-viewer.tsx   # Conflict checker
│   └── ai-input-bar.tsx          # AI scheduling input
│
├── contexts/
│   ├── auth-context.tsx          # Cognito authentication state
│   ├── calendar-context.tsx      # Calendar, events, pending items state
│   ├── chat-context.tsx          # Chat conversations state
│   ├── friends-context.tsx       # Friends list state
│   ├── google-calendar-context.tsx # Google Calendar sync state
│   └── theme-context.tsx         # Light/dark theme state
│
├── types/
│   ├── calendar.ts               # Calendar, CalendarType
│   ├── event.ts                  # CalendarEvent, RecurrenceRule
│   ├── user.ts                   # User, RlPreferences
│   ├── chat.ts                   # Chat, ChatMessage
│   ├── pending.ts                # PendingItem
│   ├── friend.ts                 # Friend
│   └── index.ts                  # Barrel export
│
├── utils/
│   ├── ai-parser.ts              # AI response type definitions
│   ├── api-client.ts             # REST API client with JWT auth
│   ├── audio-transcribe.ts       # Voice recording + backend transcription
│   ├── calendar-helpers.ts       # Calendar color mapping
│   ├── date-helpers.ts           # 16+ date utility functions
│   ├── notifications.ts          # Push notification registration
│   ├── rl-helpers.ts             # Thompson Sampling utilities
│   └── validation.ts             # Form validation (email, password, etc.)
│
├── data/
│   └── mock-data.ts              # Mock users, events, calendars, chats
│
├── constants/
│   ├── auth.ts                   # Auth validation constants
│   ├── interests.ts              # User interests list
│   └── theme.ts                  # Peachy pink palette + fonts
│
├── hooks/
│   ├── use-color-scheme.ts       # Theme detection
│   ├── use-color-scheme.web.ts   # Web-specific with hydration
│   ├── use-countdown.ts          # Countdown timer hook
│   ├── use-interests.ts          # Interests selection state
│   └── use-theme-color.ts        # Color resolver
│
├── config/
│   └── environment.ts            # Environment configuration (dev/prod)
│
├── assets/images/                # App icons + branding
│
├── __tests__/                    # Jest test files
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── utils/                    # Utility unit tests
│   ├── test-utils.tsx            # Shared renderWithProviders() helper
│   └── tsconfig.json             # Jest type declarations
├── __mocks__/                    # Jest manual mocks
│   ├── expo-av.tsx               # Stub for Audio module
│   ├── expo-constants.ts         # Stub for Constants module
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
- **Auth:** AWS Cognito (signup, login, password reset, email verification)
- **Backend:** AWS Serverless (Lambda, DynamoDB, API Gateway, Cognito, ca-central-1 region)
- **AI:** AWS Bedrock (Claude Haiku 4.5 + Sonnet 4.5) — natural-language scheduling with RL feedback
- **Environments:** Dev/prod configuration with separate bundle IDs for side-by-side installation

## Current Status

**Frontend:** Complete UI with all screens, calendar views, event management, chat, auth flow, and peachy pink theme
**Backend:** AWS Serverless infrastructure deployed (Lambda, DynamoDB, API Gateway, Cognito — ca-central-1). Backend integration in progress — pending items, calendar members, and push notifications connected to real API.
**Auth:** Cognito-based auth screens (login, signup, forgot-password, verify, welcome) with JWT token management
**AI:** AWS Bedrock integration done — natural-language scheduling (text + voice input), direct AI event creation, RL feedback via Thompson Sampling
**Google Calendar:** OAuth flow and calendar sync screens implemented

## Environment Setup

The app supports separate **development** and **production** environments with different configurations.

### Environment Files

1. **`.env.example`** - Template (committed to git) — copy this to get started

2. **`.env.development`** - Dev environment (gitignored)
   - `APP_ENV=development`
   - `API_URL` — dev API Gateway URL
   - `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` — from AWS Cognito
   - Bundle ID: `com.peachy.dev` | App name: "Peachy (Dev)"

3. **`.env.production`** - Production environment (gitignored)
   - `APP_ENV=production`
   - Production API URLs and AWS resources
   - Bundle ID: `com.peachy.app` | App name: "Peachy"

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

**Sharing with testers:**

> ⚠️ **Limitation:** EAS Update requires a custom dev client build — plain Expo Go **cannot** load EAS updates on SDK 54+. iOS distribution requires an Apple Developer account ($99/yr), so iOS builds are not available for testing at this time.

**Option 1 — Android APK (recommended for testers)**

No Apple account needed. Builds a shareable `.apk` testers can install directly.

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

EAS emails you a download link when done (~10–15 min). Share it with testers — they install the `.apk` directly, no app store needed.

**Option 2 — Local dev server with tunnel (requires repo access)**

Testers must clone the repo, set up `.env.development` with the correct AWS values (see Environment Setup below), then run:

```bash
npm install
npx expo start --tunnel
```

Scan the QR code with Expo Go — works on any network.

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
npm test                  # Run all tests (265 tests across 24 suites)
npm run test:watch        # Watch mode — re-runs affected tests on save
npm run test:coverage     # Coverage report (utils/ + components/)
```

Tests are organized by type in `__tests__/`:

```
__tests__/
  components/
    themed-text.test.tsx          # ThemedText — all types, testID passthrough
    themed-view.test.tsx          # ThemedView — children, testID, multiple children
    ai-input-bar.test.tsx         # AiInputBar — renders, initial value, input handling
    calendar-chip.test.tsx        # CalendarChip — toggle state, color
    calendar-header.test.tsx      # CalendarHeader — month/year display, navigation
    calendar-settings.test.tsx    # CalendarSettings — member management, permissions
    event-card.test.tsx           # EventCard — rendering, time display
    form-field.test.tsx           # FormField — label rendering
    form-picker-row.test.tsx      # FormPickerRow — press handling
    form-switch-row.test.tsx      # FormSwitchRow — toggle behavior
    form-text-input.test.tsx      # FormTextInput — input handling
    pending-items.test.tsx        # PendingItems — invitations, accept/decline, calendar picker
    view-switcher.test.tsx        # ViewSwitcher — tab switching
  hooks/
    use-countdown.test.ts         # useCountdown — timer logic
    use-interests.test.ts         # useInterests — selection state
    use-theme-color.test.ts       # useThemeColor — color resolution
  utils/
    auth-constants.test.ts        # Auth validation constants
    date-helpers.test.ts          # Grid generation, formatting, event filtering
    date-helpers-extended.test.ts # Additional date helper coverage
    validation.test.ts            # Email, password, name, and form validation
    calendar-helpers.test.ts      # Calendar color mapping and fallback behavior
    rl-helpers.test.ts            # Thompson Sampling slot index formula
    interests-constants.test.ts   # Interests constants
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
