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
  event-edit.tsx               # Modal: Edit existing events
  calendar-create.tsx          # Modal: Create new calendar (personal/shared)
  calendar-settings.tsx        # Modal: Edit calendar settings and manage members
  chat-detail.tsx              # Modal: Chat conversation with messaging
  user-search.tsx              # Modal: Search and select users (for chat/events/calendars)
  profile-edit.tsx             # Modal: Edit user profile (name and email)
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
    event-list.tsx             # List of event cards (scrollable via parent)
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
  pending-items.tsx            # Pending invitations
  availability-viewer.tsx      # Shows user availability for event scheduling with collapsible conflicts
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
  calendar-helpers.ts          # Calendar color mapping and utilities
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
- **Calendar color mapping:** Use `getCalendarColor(calendarId)` from `@/utils/calendar-helpers` for consistent calendar colors across all components
- Use `useThemeColor()` hook to resolve colors by theme
- Use `useColorScheme()` from `@/hooks/use-color-scheme` (not directly from react-native)
- Wrap text in `<ThemedText>` and views in `<ThemedView>` for automatic theme support
- Light/dark mode driven by system preference (`userInterfaceStyle: "automatic"`)

### Icons
- Use `<IconSymbol>` component — SF Symbols on iOS, MaterialIcons on Android/web
- Icon names are SF Symbol names (e.g., `"house.fill"`, `"calendar"`, `"mic.fill"`)
- Add new mappings in `components/ui/icon-symbol.tsx` MAPPING object
- Current mappings: `house.fill`, `calendar`, `bubble.left.fill`, `person.fill`, `plus`, `mic.fill`, `arrow.up.circle.fill`, `xmark`, `chevron.left`, `chevron.right`, `chevron.up`, `chevron.down`, `clock`, `mappin`, `bell`, `repeat`, `person.2`, `note.text`, `checkmark.circle.fill`, `sparkles`

### Styling
- Use `StyleSheet.create()` at bottom of file
- Inline styles only for one-off or dynamic values

### Code Organization & Reusability
- **Centralize constants and utilities:** Avoid duplicating color mappings, calculations, or logic across files
- **Calendar colors:** Always use `getCalendarColor()` from `utils/calendar-helpers.ts` instead of hardcoding colors
- **Date utilities:** Use functions from `utils/date-helpers.ts` for all date operations
- **Theme colors:** Use `useThemeColor()` hook for dynamic theme-aware colors
- **Component composition:** Reuse existing components (EventCard, ThemedText, IconSymbol) rather than creating new ones
- **Avoid premature abstraction:** Only extract utilities when the same code appears in 3+ places

### State Management
- **Current:** React Context (`contexts/calendar-context.tsx`)
- Provides:
  - **Calendar data:** `calendars`, `events`, `visibleEvents`
  - **Pending items:** `pendingItems` (calendar invites, event invites, event updates) — lightweight references only
  - **Chat data:** `chats`, `getChatMessages(chatId)`
  - **User data:** `getUser(userId)` — fetches user by ID for enriching pending items with sender names
  - **Calendar actions:** `toggleCalendarVisibility`, `addEvent`, `addCalendar`
  - **Event invite actions:** `acceptEventInvite(eventId)`, `declineEventInvite(eventId)` — syncs status across pending items and chat messages
  - **Chat actions:** `updateChatMessage(chatId, messageId, updates)` — also syncs with pending items when invite status changes
- **Status syncing:** Accepting/declining event invites updates both pending items and chat messages automatically
- **Pending item enrichment:** UI components use `getUser()`, `events`, and `calendars` to derive display data (title, description) from references
- **Future:** Production state library TBD (see §9.1 — do not implement Redux/Zustand/etc. preemptively)

## Data Types

### Core Types
- **Calendar** (`types/calendar.ts`): Calendar entity with members, visibility, type (personal/shared)
- **CalendarEvent** (`types/event.ts`): Event with recurrence, reminders, invitations, designee
  - **AI fields** (optional): `aiGenerated`, `aiInput`, `aiEditedFields` - track AI-created events for RL training
- **User** (`types/user.ts`): User profile with name, username (unique handle), email, avatar
- **Chat** (`types/chat.ts`): Chat conversation (direct or calendar group) with participants and last message
- **ChatMessage** (`types/chat.ts`): Individual message with sender, content, read status
  - Message types: `text`, `event_invite`
  - Event invites include `eventId` and `inviteStatus` (`pending`, `accepted`, `declined`)
  - Invite status persists after user responds
- **PendingItem** (`types/pending.ts`): Lightweight notification/invitation entity (reference-only)
  - Types: `calendar_invite`, `event_invite`, `event_update`
  - Status: `pending`, `accepted`, `declined`
  - **Design:** Stores only references (`eventId`, `calendarId`) - full details fetched separately
  - **No duplication:** Title, description derived from referenced events/calendars client-side
  - **Client enrichment:** UI components look up event/calendar data via `CalendarContext.getUser()`

### Date Utilities (`utils/date-helpers.ts`)
- **Grid generation:** `getMonthGrid()`, `getWeekDates()`
- **Event filtering:** `getEventsForDay()`, `getEventsForWeek()`, `getEventsForToday()`, `getEventsForTomorrow()`, `getEventsThisWeek()`
- **Formatting:** `formatTime()`, `formatDateRange()`, `formatDateSectionHeader()`
- **Comparison:** `isSameDay()`
- **Time grid:** `getEventTopOffset()`, `getEventHeight()`
- **Labels:** `getMonthName()`, `getDayName()`

### Calendar Utilities (`utils/calendar-helpers.ts`)
- **CALENDAR_COLORS:** Centralized calendar color mapping (cal-1 through cal-4)
- **getCalendarColor(calendarId):** Returns calendar color with fallback to default peachy color
- Used consistently across all calendar components (month view, week view, day view, event lists)

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
- **Consistent card design** — event invites in chat use same card design as pending items (icon, title, action buttons)
- **Modal headers** — all modal screens use custom headers with `headerShown: false` to avoid duplicate navigation bars
- **Owner-based permissions** — only event creators (createdBy field) can edit or delete events; non-owners see read-only view
- **Status syncing** — event invite status automatically syncs between pending items and chat messages using shared eventId
- **Reference-only pending items** — PendingItem stores only references (eventId, calendarId), not duplicates; UI enriches with event/calendar data client-side for single source of truth

## Features Implemented

### Home Screen (Agenda View)
- **Pending Items Section:**
  - Calendar invitations (shared calendar feature showcase)
  - Event invitations (tap to view event details)
  - Event updates
  - Accept/Decline actions with confirmation
  - **Status syncing:** Accepting/declining event invites syncs status to chat messages automatically
  - Shows only items with `status === 'pending'`
  - Color-coded icons by item type
- **Upcoming Events Timeline:**
  - Grouped by "Today", "Tomorrow", "This Week"
  - Sub-grouped by date within "This Week"
  - Event cards with time, location, calendar color
  - Tap any event to view full details
  - Empty state with helpful message
- **AI Input Bar:** Natural-language scheduling input at bottom
- **Add Button:** Quick access to create new events

### Calendars Screen (Calendar Management)
- **Segmented Control:** Toggle between "Calendar" and "Manage" views
- **Calendar View:**
  - Month View: 6×7 grid with event indicator dots, tap to select day
    - **Scrollable:** Scroll to see selected day's events below the calendar grid
    - Event List: Shows all events for selected day below month view
  - Week View: 7-column time grid (6am–11pm) with positioned event blocks
  - Day View: Single-column time grid with positioned event blocks
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
  - "+" button to start new direct messages
  - Last message preview with smart timestamps ("Just now", "2h", "3d")
  - Unread message badges
  - Sectioned list (Calendar Chats / Direct Messages)
  - Empty state with helpful message
- **Chat Detail View (Full Messaging):**
  - Real-time message interface with bubble design
  - Send messages with text input and send button
  - **Event invite messages:**
    - Card design matching pending items (icon + title + buttons)
    - Accept/Decline buttons for pending invites (received only)
    - Status badge for accepted/declined invites (green/red)
    - **Status syncing:** Accepting/declining event invites syncs status to pending items automatically
    - Tap card to view full event details
    - Different appearance for sent vs received invites
  - Message timestamps
  - Sender names for group chats
  - Different bubble styles for sent/received messages
  - Add people to chat via user search
  - Keyboard-aware input bar
- **User Search:**
  - Search by username, name, or email
  - Displays @username handle for each user
  - Single selection for new direct messages
  - Multiple selection for event invites and calendar members
  - Used for chat invites, event invites, and calendar members
  - Visual selection with checkmarks
  - Selected count banner

### Profile Screen (User Settings)
- **User Info Display:**
  - Avatar (initial letter placeholder)
  - Name, @username handle, and email
  - Edit Profile button (navigates to edit screen)
- **Profile Editing:**
  - Edit name, username, and email fields
  - Username validation (alphanumeric and underscores only)
  - Email validation (format check)
  - Avatar section with "Change Photo" placeholder
  - Info text about visibility to other users
  - Save changes with validation
  - Cancel option
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
  - **Edit button** - only visible to event owner (createdBy field)
  - **Delete button** - only visible to event owner with confirmation
- **Create Events:**
  - Event fields: title, calendar, all-day toggle, start/end time, location, description
  - **Calendar Selection:**
    - Tap calendar field to open picker modal
    - Shows all calendars with color dots and type (Personal/Shared)
    - Current selection marked with checkmark
    - Tap to select, auto-close
  - **Invite People:**
    - Add invitees by searching username
    - Visual invitee chips with remove option
    - Shows count of invited people
  - **Availability Checker:**
    - Real-time availability view for all invitees
    - Visual status indicators: checkmark (available) / X icon (busy)
    - Shows "Available" or conflict count per person
    - Color-coded borders: green (available) / red (busy)
    - Collapsible conflict details (tap to expand)
    - Lists conflicting events with times and icons
    - Summary: "X available • Y busy"
    - Updates when time/date changes
    - **Smart conflict detection:** When editing events, excludes the current event from conflict checking (event doesn't count as conflicting with itself)
- **Edit Events:**
  - **Owner-only permission** - only event creator can edit
  - Permission denied screen shown to non-owners
  - Pre-populated form with all existing event data
  - Modify title, calendar (via picker modal), all-day toggle, start/end time, location, description
  - Manage invitees (add/remove via user search)
  - Availability checking for updated times/invitees (excludes current event from conflicts)
  - Save changes with validation
  - Cancel option
- Event display shows time, location, and calendar color

### AI Features (Event Creation via Natural Language)
- **AI Input Bar:** Bottom of Home screen for natural language scheduling
- **Text Input:** Type requests like "dinner with Jordan tomorrow at 7pm"
- **Voice Input:** Mic button (placeholder - voice transcription TBD)
- **Smart Parsing:** AI extracts title, time, location, invitees from natural language
- **Pre-fill Form:** Navigates to event create screen with AI-suggested data
- **User Review:** User can edit all fields before creating event
- **AI Attribution Badge:** Shows original input on create screen and event detail
- **Edit Tracking:** Tracks which fields user changed (for RL training)
- **Mock Parser:** `utils/ai-parser.ts` simulates AI parsing (backend integration TBD)
- **Future:** AWS Bedrock (Claude Haiku 4.5 for speed, Sonnet 4.5 for complex requests)

### Navigation
- 4 tabs: Home (agenda), Calendars (grid + management), Chat (conversations), Profile (settings)
- Modal screens for event and calendar creation (all use custom headers with `headerShown: false`)
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
- **Offline sync conflict resolution** (last-write-wins, CRDTs, operational transforms)
- **RL architecture details** for AI scheduling
- **AI model selection** (Claude Haiku for speed vs Sonnet for accuracy)
- **Default permission templates** for shared calendars
- **Voice-to-text provider** for AI input
- **Native date/time picker** integration (currently simplified display)
- **Image processing** for avatars (resize, compress, format conversion)
- **Message delivery guarantees** (at-least-once vs exactly-once)

## FUTURE — Do Not Implement

Do not build these unless explicitly requested (see `project.md` §4):

- Social event feed / discovery
- Calendar sync (import/export to Google/Apple/Outlook)
- Siri-style voice without app open
- Guest / no-login usage

Do not add abstractions, hooks, or prep code "in anticipation" of these features.

## Mock Data (`data/mock-data.ts`)

The app uses comprehensive mock data for development and testing:

- **Users:** `currentUser` (@alexmorgan) + 3 contacts (@jordanlee, @taylorsmith, @caseyjohnson) with names, usernames, and emails
- **Calendars:** 4 calendars (Personal, Work, Family, Fitness) with different types and members
- **Events:** 13 events spanning today through 3 weeks, including:
  - Recurring events (daily standups, weekly workouts)
  - All-day events (birthdays)
  - Events with location, reminders, invitations
  - Events across different calendars
  - **Event-13 (Team Lunch)** and **Event-4 (Dinner with Family)** used for testing status syncing between pending items and chat
- **Chats:** 3 conversations (2 calendar groups, 1 DM) with last messages and unread counts
  - Chat messages include event invites with Accept/Decline functionality
  - Event invite messages have status (pending/accepted/declined)
  - **Work chat** references event-13 (Team Lunch) to match pending items
  - **Family chat** references event-4 (Dinner with Family) to match pending items
- **Pending Items:** 3 pending items (1 calendar invite, 2 event invites)
  - Event invites reference event-13 and event-4 to test status syncing with chat messages

All mock data uses realistic timestamps relative to "now" for testing time-based features.

## Next Steps (Backend Integration)

### Backend Documentation

**📄 `DYNAMODB_SCHEMA.md`** - Complete database schema design
- 3-table architecture (PeachyMain, PeachyUsers, PeachyMessages)
- Single-table design patterns for related entities
- Access patterns and query examples
- Composite keys and GSI strategy
- S3 storage for avatars and media
- Migration path from mock data
- Visual Mermaid diagrams (6 diagrams showing entities, relationships, GSI patterns)

**📄 `SCHEMA_IMPROVEMENTS.md`** - Schema optimization documentation
- Eliminated PENDING_ITEM and EVENT data overlap
- Converted pending items to reference-only entities
- Before/after comparisons and benefits
- Migration guide for backend implementation

**📄 `API_SPECIFICATION.md`** - Complete API specification
- 39 REST endpoints
- Authentication flows (AWS Cognito)
- Request/response types for all endpoints
- Business logic and side effects
- Chat via polling/refresh (simple, no WebSocket needed for MVP)
- File upload strategies (S3 presigned URLs)
- AI endpoints (TBD - AWS Bedrock)
- Rate limiting and error handling
- Frontend integration checklist

### Key Design Decisions

**Database:**
- **3 DynamoDB tables:** PeachyMain (calendars, events, chats, pending items), PeachyUsers (profiles), PeachyMessages (chat history)
- **Single-table design** for related entities (avoids joins)
- **Composite keys** for efficient range queries
- **GSI overloading** to minimize index costs
- **Multi-item pattern** for many-to-many relationships
- **TTL** on pending items for auto-cleanup (30 days)

**API:**
- **REST API** (API Gateway + Lambda) for CRUD operations
- **Chat updates** via polling/refresh (no real-time needed for MVP)
- **Presigned S3 URLs** for file uploads (avatars)
- **Cognito** for authentication (JWT tokens)
- **Bedrock** for AI features (TBD)

**Chat Architecture (Simple):**
- **Pull-to-refresh** for new messages
- **Optional polling** (5-10s interval when chat is open)
- **Optimistic updates** for sent messages
- **Can add WebSocket later** if users request real-time features

### Implementation Steps

**Phase 1: Core Backend**
1. **AWS CDK Setup** → Infrastructure as code for all resources
2. **Cognito User Pool** → Authentication with email/password
3. **DynamoDB Tables** → Create 3 tables with indexes (PeachyMain, PeachyUsers, PeachyMessages)
4. **Lambda Layer** → Shared code (DynamoDB client, auth utilities)

**Phase 2: REST API**
5. **API Gateway REST API** → 39 endpoints
6. **Lambda Functions** → CRUD operations for users, calendars, events, chats, pending items
7. **S3 Bucket** → Avatar storage with presigned URLs

**Phase 3: Chat & Advanced Features**
8. **Chat polling/refresh** → Implement message fetching with optimistic updates
9. **Offline Sync** → Conflict resolution strategy (last-write-wins, optimistic locking)
10. **AI Integration** → AWS Bedrock (Claude) for natural-language scheduling (TBD)

**Phase 4: Optional Real-time (Future)**
11. **WebSocket API** (if needed) → Add real-time message broadcasting
12. **Connection Management** → Store connections in PeachyUsers table (no 4th table needed)
13. **Add GSI3** to PeachyUsers → ConnectionId index for quick lookups

**Deployment:**
- **Environments:** dev (auto-deploy from main) + prod (manual approval from release tags)
- **Monitoring:** CloudWatch Logs, Metrics, Alarms

### Frontend Integration Checklist

**Phase 1: Authentication**
- [ ] Replace mock user with Cognito SDK
- [ ] Implement login/signup screens
- [ ] Store JWT tokens in Expo SecureStore
- [ ] Auto-refresh tokens on 401 errors

**Phase 2: REST API Integration**
- [ ] Create API client (axios with interceptors)
- [ ] Replace CalendarContext with API calls
- [ ] Add loading states to all screens
- [ ] Add error handling (toast notifications)
- [ ] Implement optimistic updates (update UI immediately, revert on error)

**Phase 3: Chat & Updates**
- [ ] Implement pull-to-refresh for chat messages
- [ ] Add optimistic updates for sent messages
- [ ] Implement message polling (5s interval when chat is open)
- [ ] Add loading states for message fetching
- [ ] Refresh pending items when accepting/declining
- [ ] Refresh calendar data when navigating to Calendars screen
- [ ] Add offline queue for failed message sends

**Phase 4: File Uploads**
- [ ] Implement avatar upload flow (get presigned URL → upload to S3)
- [ ] Add image picker (expo-image-picker)
- [ ] Show upload progress

**Phase 5: Offline Support (TBD)**
- [ ] Set up local database (AsyncStorage or WatermelonDB)
- [ ] Queue failed requests (retry on reconnect)
- [ ] Implement conflict resolution strategy
- [ ] Add offline indicator UI

**Phase 6: AI Features**
- ✅ AI input bar with text input
- ✅ Mock AI parser (`utils/ai-parser.ts`)
- ✅ Pre-fill event create form with AI-suggested data
- ✅ AI attribution badges (create screen + event detail)
- ✅ Track edited fields for RL training
- [ ] Integrate AWS Bedrock (Claude Haiku/Sonnet)
- [ ] Voice-to-text transcription
- [ ] Smart scheduling suggestions (auto-detect conflicts, suggest better times)
- [ ] Auto-schedule (AI picks best time slot based on availability)

**TypeScript Types:**
- ✅ All types already defined in `types/` directory
- ✅ Match database schema exactly
- ✅ Ready to use with API responses
