# Peachy — Project Document

> **For AI agents:** This document is the source of truth for Peachy's scope, architecture, and constraints. Reference it before making architectural decisions. Sections marked `[TBD]` require team input before implementation. Features marked `[FUTURE]` are out of MVP scope — do not implement unless explicitly requested.

## 1. Overview

**Peachy** is an intelligent mobile calendar application that reimagines how people manage their time. Users schedule events through natural language — text or voice — powered by an LLM + Reinforcement Learning pipeline. Beyond personal scheduling, Peachy enables shared calendars for families, groups, and organizations, with integrated messaging so coordination happens in one place.

- **Platform:** React Native (Expo)
- **Backend:** AWS Serverless
- **Team:** 4 university students (ML capstone project, AI-assisted development)
- **Timeline:** 3–4 months to MVP
- **Development approach:** AI-assisted ("vibe coding") with careful review of generated artifacts

## 2. Core Features

### 2.1 Text & Voice Scheduling (ML Pipeline)

The flagship feature. Users describe what they want in natural language, and Peachy handles the rest.

**Input Modes:**
- Text input (chat-style interface)
- Voice input: push-to-talk and conversational follow-up when clarification is needed
- *Future stretch goal:* Siri-style invocation without opening the app

**Capability Spectrum:**
| Complexity | Example |
|---|---|
| Simple reminder | "Remind me tomorrow at 5pm to water my plants" |
| Schedule modification | "Change my gym schedule next week to match Gerald's" |
| Availability-aware booking | "Book a meeting with John for my next available hour during work" |
| Social invite | "Ask Emily if she's down for dinner tomorrow at 7pm at Shanghai Palace" |
| Cross-person query | "When are both me and Sarah free this weekend?" |

**Architecture — Hybrid Pipeline:**
- **Simple requests** (all info provided, single action): LLM uses tool-calling to directly invoke backend functions (e.g., `createEvent`, `getSchedule`, `findAvailableSlot`). Prioritizes speed — the user should never wait unnecessarily when they've clearly stated everything.
- **Complex requests** (multi-step, cross-user, ambiguous): LLM outputs a structured intent, which a deterministic orchestrator decomposes into backend calls. More controllable, testable, and debuggable.
- **Conversational follow-up**: When the request is genuinely ambiguous or missing critical info, the assistant asks — but only when necessary. Frustration-free UX is the goal.

**Reinforcement Learning Component:**
- Evaluates and ranks candidate time slots for favorability
- Signal design is TBD but expected to include:
  - User behavioral patterns (when they typically schedule, accept/decline, reschedule)
  - Explicit preferences (e.g., "I prefer mornings for meetings")
  - Contextual signals (event type, location, relationship to other events)
- Likely a multi-agent RL setup where different signal types are weighted
- Compute: Anyscale ($4,000 credits) and Modal ($2,000 credits) available for training

**LLM Selection:** **Decided — AWS Bedrock (Claude models).** Tiered strategy: Claude Haiku 4.5 for classification + simple requests (< 2s target), Claude Sonnet 4.5 for complex multi-step requests (< 5s target). Claude dominates tool-calling benchmarks (BFCL, Scale AI ToolComp). See `Infra/Peachy-Infra/infrastructure.md` for full benchmark data and rationale.

### 2.2 Shared Calendars

Calendars that multiple people can view and interact with. Three tiers:

**Personal Shared Calendars:**
- E.g., a family calendar, a couple's calendar, a roommate calendar
- Members can add events with **designators** — assigning an event to a specific person (e.g., a mother adding "pick up kids" assigned to the father)
- The assignee receives a notification for that event
- Natural fit for people sharing physical spaces

**Group Calendars:**
- For group projects, friend groups, teams
- Collaborative scheduling with shared visibility

**Organization / Public Calendars:**
- Organizations (clubs, companies, artists) can publish event calendars
- Users **subscribe** to these calendars
- Subscribers receive notifications of new events (configurable)

**Permissions Model — Discord-style Roles:**
- Custom roles per shared calendar (like Discord's role system)
- Permissions include: add events, edit events, delete events, assign events to others, manage roles, invite members
- **Sensible defaults are critical** — users shouldn't need to be "power users" to set up a working shared calendar
- Default role templates: Admin, Editor, Viewer (with ability to customize)

### 2.3 Messaging

Full-featured messaging, not a stripped-down notification feed. The reasoning: when an event invite triggers a negotiation ("Can we do 8pm instead?"), users shouldn't have to switch to another app.

**Features:**
- 1-on-1 and group chats
- Text, media sharing
- Integrated event invites and RSVPs within chat
- Event cards embedded in conversations (tap to view/add to calendar)
- Group chats as an entity (tied to shared calendars or standalone)

**Technical approach:**
- WebSocket connections (API Gateway WebSocket API) for real-time message delivery
- Message persistence in DynamoDB
- Push notifications (SNS → FCM/APNs) for offline users

## 3. Supporting Features

### 3.1 Custom Calendar Views
Users will accumulate events across personal, shared, and subscribed calendars. They need the ability to:
- Create custom filtered views (e.g., "Work only", "Family + Personal", "All subscribed events")
- Toggle calendar visibility
- Different view modes (day, week, month, agenda)

### 3.2 Granular Notification Settings
**This is a first-class UX concern.** The notification settings UI must be modern, smooth, and intuitive.

- Per-calendar notification configuration (personal calendar ≠ subscribed org calendar ≠ family calendar)
- Notification types: event reminders, new event added, event modified, event invite, chat message
- Quiet hours / Do Not Disturb
- Delivery method preferences where applicable (push, in-app)

### 3.3 Offline-First Architecture
This is a calendar app — it must boot instantly even without internet.
- Local storage of calendar data for immediate access
- Sync when connectivity is restored
- Graceful degradation: features requiring internet (AI scheduling, chat, shared calendar updates) show clear offline states
- Users not connected to the internet are not expected to receive real-time shared calendar updates

### 3.4 Accessibility
Best-effort adherence to WCAG 2.1 AA, with the understanding that:
- Where WCAG compliance is low-effort, we adhere to it
- WCAG doesn't cover all accessibility needs — the team will remain mindful of gaps (research shows ~50% of blind users' struggles aren't addressed by WCAG)
- The voice input feature is itself a significant accessibility win — lean into it
- Core considerations: screen reader support, sufficient contrast, appropriate touch targets, semantic markup

### 3.5 Time Zone Handling
- Auto-detect from device, with manual override available
- Cross-timezone events: LLM infers timezone from language context, asks for clarification when ambiguous
- Events store timezone data; display adapts to viewer's local time

## 3.6 App Navigation & Home Screen `[TBD — needs UI/UX refinement]`

**Proposed navigation structure (bottom tab bar):**
| Tab | Purpose |
|---|---|
| **Home** | Upcoming events / calendar view. Floating action button for AI text/voice input. The primary screen. |
| **Calendars** | Browse and manage personal, shared, and subscribed calendars. Calendar settings and roles. |
| **Chat** | Messaging conversations (1-on-1 and group). Event invite cards inline. |
| **Profile / Settings** | Account, notification preferences, timezone, subscription tier, accessibility options. |

**Home screen details:**
- Default shows today's agenda / upcoming events
- Quick-switch to week or month view
- AI input always accessible (floating button or persistent top bar)
- Offline-capable: loads cached calendar data instantly

> **TODO:** Full UI/UX specification needed — wireframes, component hierarchy, interaction patterns, design system. This section is a starting point for discussion, not a final spec.

## 4. Future / Low-Priority Features `[FUTURE]`

> **For AI agents:** Do NOT implement any of these unless explicitly requested. Do not build abstractions or hooks "in preparation" for these features. Keep architecture clean and extensible, but do not add code for unrequested scope.

These are documented for awareness but are **not in MVP scope**.

| Feature | Priority | Notes |
|---|---|---|
| Social event feed / discovery | Low | "What concerts are happening in my city next weekend?" — requires large user base to be useful. Keep architecture extensible for this. |
| Calendar sync (import) | Low | One-way import from Google Calendar, Apple Calendar, Outlook. Not a core feature — a future "maybe." |
| Siri-style voice (no app open) | Low | OS-level integration for voice commands without launching the app. Research feasibility. |
| Guest / no-login usage | Very Low | Allow limited app usage without authentication. Only pursue if low-effort. |
| Reverse calendar sync (export) | Very Low | Push Peachy events to external calendars. Only if it makes sense later. |

## 5. Tech Stack

### Frontend
- **Framework:** React Native with Expo
- **State management:** TBD
- **Offline storage:** TBD (e.g., AsyncStorage, SQLite via expo-sqlite, WatermelonDB)
- **Voice:** Expo speech-to-text / on-device transcription + cloud fallback

### Backend (AWS Serverless)
- **Compute:** AWS Lambda
- **API:** API Gateway (REST + WebSocket)
- **Database:** DynamoDB (primary data store)
- **Auth:** AWS Cognito (email/password + social login — Google, Apple; flexible, no forced phone or social)
- **Storage:** S3 (media, attachments)
- **Notifications:** SNS → FCM (Android) / APNs (iOS)
- **Future (if needed):** OpenSearch or similar for event discovery queries; Kinesis for streaming if scale demands it

### ML / AI
- **LLM:** AWS Bedrock — Claude Haiku 4.5 (classification + simple) / Claude Sonnet 4.5 (complex multi-step)
- **RL:** Multi-agent RL for time slot evaluation — architecture TBD
- **Compute credits available:**
  - Anyscale: $4,000
  - Modal: $2,000
  - AWS: $500 (CAD)
  - Snowflake: $1,600 (potential use for analytics/data warehousing)

### Infrastructure
- **Infrastructure-as-Code:** AWS CDK
- CI/CD: TBD
- Monitoring: TBD

## 6. Entities & Data Model (High-Level)

> Detailed schema to be defined in a separate `schema.md`. This is the conceptual entity map.

```
User
├── has many → Calendar (personal)
├── member of → Calendar (shared, via CalendarMembership)
├── has many → Chat
├── has one → NotificationPreferences (global)
├── has many → NotificationPreferences (per-calendar overrides)
├── subscribes to → Calendar (org/public, via Subscription)
└── belongs to → Organization (optional)

Calendar
├── has many → Event
├── has many → Role (permission templates)
├── has many → CalendarMembership (user + role)
└── type: personal | shared | organization/public

Event
├── belongs to → Calendar
├── has optional → designator (assigned User)
├── status: confirmed | tentative | cancelled
└── has: time, timezone, location, recurrence rules

Chat / GroupChat
├── has many → Message
├── has many → participants (Users)
└── optionally linked to → Calendar (shared)

Message
├── belongs to → Chat
├── type: text | media | event-invite-card
└── has: sender, timestamp, content

Organization
├── has many → Calendar (public)
├── has many → members (Users)
└── has: profile, branding

Role (per-calendar)
└── permissions: add_event, edit_event, delete_event, assign_event, manage_roles, invite_members

Subscription
├── User → Calendar (org/public)
└── has → NotificationPreferences (override)
```

## 7. Monetization

**Model:** Subscription tiers (Free / Paid tiers TBD)

**Principles:**
- Free tier must be generous — users should get real value without paying
- No pay-as-you-go surprises; users always know exactly what they're paying
- Advanced features (AI scheduling, extended shared calendars, etc.) are explorable in free tier but usage-limited
- Possible limits: storage caps, number of shared calendars, number of AI requests per period
- Exact tier definitions and pricing TBD

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| App startup (offline) | Near-instant — cached calendar loads immediately |
| API latency (simple requests) | < 500ms for standard CRUD operations |
| AI scheduling (simple) | < 2s for simple tool-calling requests |
| AI scheduling (complex) | < 5s with progress indication |
| Availability | High availability — calendar data must not be down or laggy |
| Scalability | Architecture must handle growth without throttling |
| Offline support | Core calendar readable offline; sync on reconnect |
| Accessibility | Best-effort WCAG 2.1 AA |
| Free tier UX | Smooth, non-degraded experience for unpaid users |

## 9. Open Design Decisions `[TBD]`

> **For AI agents:** These are unresolved. Do not make assumptions about these decisions. If your task depends on one of these, ask the team for guidance or flag it as a blocker.

| # | Decision | Context | Impact |
|---|---|---|---|
| 1 | ~~LLM provider selection~~ | **Decided: AWS Bedrock (Claude Haiku 4.5 + Sonnet 4.5)** | Resolved |
| 2 | RL architecture details | Signal design, multi-agent setup, training pipeline | Blocks RL component |
| 3 | State management library | Redux, Zustand, Jotai, etc. | Affects all frontend components |
| 4 | Offline storage strategy | AsyncStorage vs. SQLite vs. WatermelonDB | Affects offline-first architecture |
| 5 | ~~IaC tooling~~ | **Decided: AWS CDK** | Resolved |
| 6 | Default permission templates | What Admin/Editor/Viewer can do exactly | Affects shared calendar implementation |
| 7 | Monetization tier definitions | What's free, what's paid, at what limits | Affects feature gating |
| 8 | Chat WebSocket implementation | Connection management, reconnection, presence | Affects messaging feature |
| 9 | Voice-to-text provider | On-device vs. cloud, which service | Affects voice input feature |

## 10. Key Constraints & Principles

> **For all contributors (human and AI):**

1. **Offline-first is non-negotiable** — the calendar must load instantly without internet
2. **Don't over-engineer** — MVP timeline is 3-4 months with 4 people
3. **Notification UX is first-class** — treat notification settings as a core feature, not an afterthought
4. **Accessibility is best-effort but genuine** — if it's low-effort to be WCAG compliant, do it
5. **Free tier must feel complete** — no crippled UX for non-paying users
6. **Speed matters for AI features** — simple AI requests must feel instant; never ask unnecessary follow-up questions
7. **Sensible defaults everywhere** — roles, notifications, calendar views should work great out of the box

---

*This is a living document. Updated as decisions are made.*
