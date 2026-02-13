# CLAUDE.md — Peachy

## Project Overview

Peachy is an intelligent mobile calendar app with natural-language scheduling (LLM + RL), shared calendars, and integrated messaging. Built by 4 university students as an ML capstone project.

**Current Status:** Frontend UI complete with all screens designed (Home, Calendars, Chat, Profile), calendar views, event management, pending items system, chat interface, and peachy pink theme. Backend not yet implemented.

**Key Feature:** Shared calendars with integrated chat — the main selling point of the app.

**Source of truth:** `project.md` — always reference it before making architectural decisions.

## Tech Stack

- **Framework:** React Native (Expo SDK 54, React 19, New Architecture enabled)
- **Routing:** Expo Router v6 (file-based routing, typed routes enabled)
- **Language:** TypeScript (strict mode)
- **Styling:** React Native StyleSheet (no utility-CSS library)
- **State Management:** React Context (temporary — production library TBD)
- **Animations:** react-native-reanimated
- **Linting:** ESLint with eslint-config-expo (flat config)
- **Backend:** AWS Serverless (Lambda, DynamoDB, API Gateway, Cognito, CDK) — **not yet implemented**
- **AI:** AWS Bedrock (Claude Haiku 4.5 + Sonnet 4.5) — **not yet implemented**

## Project Structure

```
app/                           # Expo Router file-based routes
  _layout.tsx                  # Root layout (CalendarProvider, Stack navigator)
  event-create.tsx             # Modal: Create event with invitees + availability checker
  event-detail.tsx             # Modal: View full event details
  calendar-create.tsx          # Modal: Create new calendar (personal/shared)
  calendar-settings.tsx        # Modal: Edit calendar settings and manage members
  chat-detail.tsx              # Modal: Chat conversation with messaging
  user-search.tsx              # Modal: Search and select users (for chat/events/calendars)
  (tabs)/                      # Bottom tab navigator
    _layout.tsx                # Tab config (Home, Calendars, Chat, Profile)
    index.tsx                  # Home: Pending items + upcoming events + AI input
    calendars.tsx              # Calendars: Calendar views (grid) + calendar management
    chat.tsx                   # Chat: Conversation list (calendar chats + DMs)
    profile.tsx                # Profile: User info + settings
components/
  calendar/                    # Calendar-specific components (13 files)
    calendar-header.tsx        # Month/year title + navigation
    view-switcher.tsx          # Day/Week/Month toggle
    calendar-filter-bar.tsx    # Horizontal calendar chips
    calendar-chip.tsx          # Toggleable calendar filter
    month-view.tsx             # 6×7 calendar grid
    month-day-cell.tsx         # Day cell with event dots
    week-view.tsx              # 7-column time grid + headers
    day-view.tsx               # 1-column time grid
    time-grid.tsx              # Shared 24-hour grid (used by day + week)
    event-block.tsx            # Event positioned on time grid
    event-card.tsx             # Event card for agenda list
    event-list.tsx             # FlatList of event cards
    upcoming-events.tsx        # Timeline of today/tomorrow/this week events
  form/                        # Reusable form components (5 files)
    form-field.tsx             # Label wrapper
    form-text-input.tsx        # Themed text input
    form-switch-row.tsx        # Toggle switch row
    form-picker-row.tsx        # Pressable picker display
    form-date-picker.tsx       # Date/time display (simplified)
  ui/                          # UI primitives
    icon-symbol.tsx            # Cross-platform icon (MaterialIcons fallback)
    icon-symbol.ios.tsx        # iOS-specific (SF Symbols)
  pending-items.tsx            # Pending invitations and AI suggestions
  availability-viewer.tsx      # Shows user availability for event scheduling
  ai-input-bar.tsx             # AI scheduling input (bottom of Home)
  themed-text.tsx              # Theme-aware Text wrapper
  themed-view.tsx              # Theme-aware View wrapper
  haptic-tab.tsx               # Tab with haptic feedback (iOS)
contexts/
  calendar-context.tsx         # React Context for calendar state
types/
  calendar.ts                  # Calendar, CalendarType
  event.ts                     # CalendarEvent, RecurrenceRule, ReminderOffset
  user.ts                      # User
  chat.ts                      # Chat, ChatMessage, ChatType
  pending.ts                   # PendingItem, PendingItemType, PendingItemStatus
  index.ts                     # Barrel export
utils/
  date-helpers.ts              # 16+ date utility functions (including grouping)
data/
  mock-data.ts                 # Mock calendars, events, users, chats, pending items
constants/
  theme.ts                     # Peachy pink color palette + fonts
hooks/
  use-color-scheme.ts          # Re-exports RN useColorScheme
  use-color-scheme.web.ts      # Web-specific with hydration
  use-theme-color.ts           # Resolves color from theme by key
assets/images/                 # App icons and branding
  icon.png                     # App icon
  android-icon-*.png           # Android adaptive icon assets
  splash-icon.png              # Splash screen icon
  favicon.png                  # Web favicon
```

## Development Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Start on iOS
npm run android        # Start on Android
npm run web            # Start on web
npm run lint           # Run ESLint
```

No test runner is configured yet.

## Code Conventions

### Naming
- **Files:** `kebab-case.tsx` (e.g., `themed-text.tsx`, `use-color-scheme.ts`)
- **Components:** PascalCase exports, named exports (not default) for components (e.g., `export function ThemedText`)
- **Screens/Routes:** default exports (Expo Router requirement)
- **Hooks:** `use-` prefix in filename, `use` prefix in function name

### Imports
- Path alias: `@/*` maps to project root (e.g., `@/components/themed-text`)
- Always use the `@/` alias for cross-directory imports

### Theming
- **Peachy pink palette:** Primary tint is `#FF8C6B` (light) / `#FF6B4A` (dark)
- Colors defined in `constants/theme.ts` as `Colors.light.*` / `Colors.dark.*`
- Additional color keys: `textSecondary`, `surface`, `surfaceSecondary`, `border`, `borderLight`, `danger`, `success`
- Calendar colors: 8 preset colors exported from `constants/theme.ts` as `calendarColors`
- Use `useThemeColor()` hook to resolve colors by theme
- Use `useColorScheme()` from `@/hooks/use-color-scheme` (not directly from react-native)
- Wrap text in `<ThemedText>` and views in `<ThemedView>` for automatic theme support
- Light/dark mode driven by system preference (`userInterfaceStyle: "automatic"`)

### Icons
- Use `<IconSymbol>` component — SF Symbols on iOS, MaterialIcons on Android/web
- Icon names are SF Symbol names (e.g., `"house.fill"`, `"calendar"`, `"mic.fill"`)
- Add new mappings in `components/ui/icon-symbol.tsx` MAPPING object
- Current mappings: `house.fill`, `calendar`, `bubble.left.fill`, `person.fill`, `plus`, `mic.fill`, `arrow.up.circle.fill`, `xmark`, `chevron.left`, `chevron.right`, `clock`, `mappin`, `bell`, `repeat`, `person.2`, `note.text`, `checkmark.circle.fill`

### Styling
- Use `StyleSheet.create()` at bottom of file
- Inline styles only for one-off or dynamic values

### State Management
- **Current:** React Context (`contexts/calendar-context.tsx`)
- Provides: `calendars`, `events`, `visibleEvents`, `toggleCalendarVisibility`, `addEvent`, `addCalendar`
- **Future:** Production state library TBD (see §9.1 — do not implement Redux/Zustand/etc. preemptively)

## Data Types

### Core Types
- **Calendar** (`types/calendar.ts`): Calendar entity with members, visibility, type (personal/shared)
- **CalendarEvent** (`types/event.ts`): Event with recurrence, reminders, invitations, designee
- **User** (`types/user.ts`): User profile with name, email, avatar
- **Chat** (`types/chat.ts`): Chat conversation (direct or calendar group) with participants and last message
- **ChatMessage** (`types/chat.ts`): Individual message with sender, content, read status
- **PendingItem** (`types/pending.ts`): Pending invitation or suggestion requiring user action
  - Types: `calendar_invite`, `event_invite`, `event_update`, `ai_suggestion`
  - Status: `pending`, `accepted`, `declined`

### Date Utilities (`utils/date-helpers.ts`)
- **Grid generation:** `getMonthGrid()`, `getWeekDates()`
- **Event filtering:** `getEventsForDay()`, `getEventsForWeek()`, `getEventsForToday()`, `getEventsForTomorrow()`, `getEventsThisWeek()`
- **Formatting:** `formatTime()`, `formatDateRange()`, `formatDateSectionHeader()`
- **Comparison:** `isSameDay()`
- **Time grid:** `getEventTopOffset()`, `getEventHeight()`
- **Labels:** `getMonthName()`, `getDayName()`

## Architecture Decisions

- **Expo Router** for file-based routing with typed routes
- **React Compiler** enabled (`experiments.reactCompiler: true`)
- **Platform-specific files** via `.ios.tsx` / `.web.ts` extensions
- **Haptic feedback** on tab presses (iOS only) via `HapticTab`
- **Portrait-only** orientation
- **React Context for state** — temporary until production state library is chosen
- **Custom calendar components** — no third-party calendar library (keeps bundle small, full theme control)
- **Modal presentation** for event/calendar creation
- **AI input bar as flex child** (not absolute positioned) — avoids keyboard complexity
- **Home as agenda view** — upcoming events timeline, not calendar grid
- **Calendars tab for power users** — full calendar grid views and management
- **Chat integrated with calendars** — each shared calendar has its own group chat

## Features Implemented

### Home Screen (Agenda View)
- **Pending Items Section:**
  - Calendar invitations (shared calendar feature showcase)
  - Event invitations
  - AI scheduling suggestions
  - Accept/Decline actions with confirmation
  - Color-coded icons by item type
- **Upcoming Events Timeline:**
  - Grouped by "Today", "Tomorrow", "This Week"
  - Sub-grouped by date within "This Week"
  - Event cards with time, location, calendar color
  - Empty state with helpful message
- **AI Input Bar:** Natural-language scheduling input at bottom
- **Add Button:** Quick access to create new events

### Calendars Screen (Calendar Management)
- **Segmented Control:** Toggle between "Calendar" and "Manage" views
- **Calendar View:**
  - Month View: 6×7 grid with event indicator dots, tap to select day
  - Week View: 7-column time grid (6am–11pm) with positioned event blocks
  - Day View: Single-column time grid with positioned event blocks
  - Event List: Shows events for selected day below month view
  - Calendar filters: Toggle visibility via filter chips
- **Manage View:**
  - List of all calendars with color, type, member counts
  - Tap calendar to open settings
  - Chevron indicator for navigation
- **Calendar Creation:**
  - Create new calendars with color picker (8 preset colors)
  - Calendar types: **personal** or **shared** (no organization)
  - Name, description, color selection
- **Calendar Settings (Full Management):**
  - Edit name and description
  - Change color (8 preset colors)
  - Switch between personal/shared types
  - **Member management** (shared calendars only):
    - Add members via user search
    - View all members with avatars
    - Remove members (except owner)
    - Owner badge displayed
  - Save changes button
  - Delete calendar with confirmation

### Chat Screen (Shared Calendar Communication)
- **Chat List View:**
  - Calendar Group Chats: Conversations tied to shared calendars
  - Calendar color indicator on chat items
  - Direct Messages: 1-on-1 conversations
  - Last message preview with smart timestamps ("Just now", "2h", "3d")
  - Unread message badges
  - Sectioned list (Calendar Chats / Direct Messages)
  - Empty state with helpful message
- **Chat Detail View (Full Messaging):**
  - Real-time message interface with bubble design
  - Send messages with text input and send button
  - Message timestamps
  - Sender names for group chats
  - Different bubble styles for sent/received messages
  - Add people to chat via user search
  - Keyboard-aware input bar
- **User Search:**
  - Search by name or email
  - Select multiple users
  - Used for both chat invites and event invites
  - Visual selection with checkmarks
  - Selected count banner

### Profile Screen (User Settings)
- **User Info Display:**
  - Avatar (initial letter placeholder)
  - Name and email
  - Edit Profile button
- **Settings Sections:**
  - **Account:** Notifications, Calendar Sync
  - **Privacy & Security:** Privacy controls
  - **Support:** Help & Support, About
- **Log Out:** With confirmation dialog
- All settings with icons and descriptive subtitles

### Event Management
- **View events** filtered by visible calendars
- **Tap any event** to view full details
- **Event Detail Screen:**
  - Full event information with calendar color bar
  - Date and time with formatted display
  - Location with map pin icon
  - Invitee list with avatars
  - Description
  - Recurrence info
  - Reminders list
  - Edit button (placeholder)
  - Delete with confirmation
- **Create Events:**
  - Event fields: title, calendar, all-day toggle, start/end time, location, description
  - **Invite People:**
    - Add invitees by searching username
    - Visual invitee chips with remove option
    - Shows count of invited people
  - **Availability Checker:**
    - Real-time availability view for all invitees
    - Shows "Available" or conflict count per person
    - Lists conflicting events with times
    - Color-coded: green (available) / red (busy)
    - Summary: "X available • Y busy"
    - Updates when time/date changes
- Event display shows time, location, and calendar color

### AI Features (Placeholder)
- AI input bar at bottom of Home screen
- Mic button and send button (alerts "coming soon")
- AI suggestions appear in pending items

### Navigation
- 4 tabs: Home (agenda), Calendars (grid + management), Chat (conversations), Profile (settings)
- Modal screens for event and calendar creation
- Consistent header design across all screens

## Constraints (from project.md)

1. **Offline-first is non-negotiable** — calendar must load instantly without internet
2. **Don't over-engineer** — MVP timeline is 3–4 months with 4 people
3. **Notification UX is first-class** — not an afterthought
4. **Accessibility is best-effort but genuine** — do WCAG 2.1 AA when low-effort
5. **Free tier must feel complete** — no degraded UX for non-paying users
6. **Speed matters for AI features** — simple requests must feel instant
7. **Sensible defaults everywhere** — roles, notifications, views should work out of the box

## TBD — Do Not Assume

These are unresolved decisions (see `project.md` §9). If your task depends on one, flag it:

- **State management library** (Redux, Zustand, Jotai, etc.) — currently using React Context
- **Offline storage strategy** (AsyncStorage, SQLite, WatermelonDB)
- **RL architecture details** for AI scheduling
- **Default permission templates** for shared calendars
- **Chat WebSocket implementation** details
- **Voice-to-text provider** for AI input
- **Native date/time picker** integration (currently simplified display)

## FUTURE — Do Not Implement

Do not build these unless explicitly requested (see `project.md` §4):

- Social event feed / discovery
- Calendar sync (import/export to Google/Apple/Outlook)
- Siri-style voice without app open
- Guest / no-login usage

Do not add abstractions, hooks, or prep code "in anticipation" of these features.

## Mock Data (`data/mock-data.ts`)

The app uses comprehensive mock data for development and testing:

- **Users:** `currentUser` + 3 contacts (Jordan, Taylor, Casey)
- **Calendars:** 4 calendars (Personal, Work, Family, Fitness) with different types and members
- **Events:** 12 events spanning today through 3 weeks, including:
  - Recurring events (daily standups, weekly workouts)
  - All-day events (birthdays)
  - Events with location, reminders, invitations
  - Events across different calendars
- **Chats:** 3 conversations (2 calendar groups, 1 DM) with last messages and unread counts
- **Pending Items:** 3 pending items (calendar invite, event invite, AI suggestion)

All mock data uses realistic timestamps relative to "now" for testing time-based features.

## Next Steps (Backend Integration)

When implementing the backend, use the TypeScript types in `types/` as the schema foundation:

1. **Calendar schema** → DynamoDB table design with member management
2. **Event schema** → DynamoDB table with GSI for calendar queries
3. **User schema** → Cognito + DynamoDB user profile
4. **Chat schema** → DynamoDB table with messages + real-time via WebSocket
5. **Pending items schema** → DynamoDB table for invitations and notifications
6. **API design** → REST endpoints for CRUD operations
7. **Real-time** → WebSocket for:
   - Live calendar updates
   - Chat messages
   - Pending item notifications
8. **Offline sync** → Conflict resolution strategy (last-write-wins, CRDT, etc.)
9. **AI Integration** → AWS Bedrock endpoints for natural-language scheduling

The frontend is ready to integrate with REST/GraphQL APIs:
- Replace `CalendarContext` with API calls
- Add loading/error states to all components
- Implement optimistic updates for better UX
- Connect chat to WebSocket for real-time messaging
- Wire up pending items to notification system
