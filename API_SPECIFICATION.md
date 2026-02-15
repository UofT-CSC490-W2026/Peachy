# Peachy API Specification

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Chat Updates (Polling/Refresh)](#chat-updates-pollingrefresh)
5. [Implementation Notes](#implementation-notes)
6. [Frontend Integration](#frontend-integration)

---

## Overview

**Architecture:** REST API + AWS Services

**Tech Stack:**
- **API Gateway** - REST endpoints
- **Lambda** - Business logic
- **Cognito** - Authentication
- **DynamoDB** - Database (3 tables)
- **S3** - File storage (avatars)
- **Bedrock** - AI features (TBD)

**Base URL:** `https://api.peachy.app/v1`

**Authentication:** JWT tokens via Cognito
```
Authorization: Bearer {accessToken}
```

---

## Authentication

### POST /auth/signup
Create new user account.

**Request:**
```typescript
{
  email: string;
  password: string;     // Min 8 chars, 1 uppercase, 1 number
  name: string;
  username: string;     // Unique, 3-20 chars, alphanumeric + underscore
}
```

**Response:** `201 Created`
```typescript
{
  userId: string;       // Cognito sub
  email: string;
  emailVerified: boolean;
}
```

**Errors:**
- `400` - Validation error (weak password, invalid username)
- `409` - Username or email already exists

**Notes:**
- Sends verification email
- Creates user in Cognito + PeachyUsers table
- Username is case-insensitive, stored lowercase

---

### POST /auth/signin
Authenticate existing user.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:** `200 OK`
```typescript
{
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;    // Seconds (default 3600)
  user: User;
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Email not verified

---

### POST /auth/signout
Sign out user (invalidate refresh token).

**Request:**
```typescript
{
  accessToken: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

---

### POST /auth/refresh
Refresh access token.

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response:** `200 OK`
```typescript
{
  accessToken: string;
  expiresIn: number;
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```typescript
User
```

---

## User APIs

### GET /users/search
Search for users by username, name, or email.

**Query Parameters:**
```typescript
{
  q: string;            // Search term
  limit?: number;       // Default 20, max 100
}
```

**Response:** `200 OK`
```typescript
{
  users: User[];
  total: number;
}
```

**Notes:**
- Searches username (exact match), name (partial), email (exact)
- Returns username as lowercase
- Used for @mentions, adding members, creating chats

---

### GET /users/:userId
Get user profile by ID.

**Response:** `200 OK`
```typescript
User
```

**Errors:**
- `404` - User not found

---

### PUT /users/me
Update current user's profile.

**Request:**
```typescript
{
  name?: string;
  username?: string;    // Validates uniqueness
  email?: string;       // Validates uniqueness, sends verification
  avatarUrl?: string;
}
```

**Response:** `200 OK`
```typescript
User
```

**Errors:**
- `400` - Validation error
- `409` - Username or email already exists

**Notes:**
- Changing email requires re-verification
- Username change cascades to all references (TBD - how to handle?)

---

### GET /users/me/avatar/upload-url
Get presigned S3 URL for avatar upload.

**Query Parameters:**
```typescript
{
  contentType: string;  // e.g., "image/jpeg"
  fileSize: number;     // Bytes, max 5MB
}
```

**Response:** `200 OK`
```typescript
{
  uploadUrl: string;    // Presigned S3 URL (PUT)
  avatarUrl: string;    // Final public URL (CloudFront)
  expiresIn: number;    // Seconds (default 300)
}
```

**Flow:**
1. Client calls this endpoint
2. Client uploads directly to S3 using uploadUrl
3. Client calls `PUT /users/me` with avatarUrl
4. **TBD:** Image processing (resize to 256x256, compress)

---

## Calendar APIs

### GET /calendars
Get all calendars user has access to.

**Query Parameters:**
```typescript
{
  includeShared?: boolean;  // Default true
}
```

**Response:** `200 OK`
```typescript
{
  calendars: Calendar[];
}
```

**Notes:**
- Returns calendars where user is owner or member
- Includes `isVisible` field (client-side toggle, not persisted)

---

### GET /calendars/:calendarId
Get calendar details with members.

**Response:** `200 OK`
```typescript
{
  calendar: Calendar;
  members: User[];      // Resolved user objects
}
```

**Errors:**
- `403` - User is not a member of this calendar
- `404` - Calendar not found

---

### POST /calendars
Create new calendar.

**Request:**
```typescript
{
  name: string;
  color: string;        // Hex color
  type: "personal" | "shared";
  description?: string;
}
```

**Response:** `201 Created`
```typescript
Calendar
```

**Notes:**
- Current user automatically added as owner and first member
- If type is "shared", auto-creates calendar group chat

---

### PUT /calendars/:calendarId
Update calendar metadata.

**Request:**
```typescript
{
  name?: string;
  color?: string;
  description?: string;
}
```

**Response:** `200 OK`
```typescript
Calendar
```

**Errors:**
- `403` - Only owner can update

**Notes:**
- Cannot change type (personal ↔ shared)
- Triggers `onCalendarUpdate` subscription

---

### DELETE /calendars/:calendarId
Delete calendar.

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

**Errors:**
- `403` - Only owner can delete

**Notes:**
- Cascades: Deletes all events, chat, pending invitations
- Removes all members
- **TBD:** Soft delete vs hard delete?

---

### POST /calendars/:calendarId/members
Add member to calendar (invite).

**Request:**
```typescript
{
  userId: string;
}
```

**Response:** `200 OK`
```typescript
{
  calendar: Calendar;
  members: User[];
  pendingItem: PendingItem;  // Created invitation
}
```

**Errors:**
- `403` - Only owner can add members
- `404` - User not found
- `409` - User already a member

**Notes:**
- Creates pending item (calendar_invite) for invited user
- User must accept invitation to join
- Once accepted, automatically added to calendar group chat

---

### DELETE /calendars/:calendarId/members/:userId
Remove member from calendar.

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

**Errors:**
- `403` - Insufficient permissions (owner can remove anyone except self, members can only remove self)
- `404` - User is not a member

**Notes:**
- Cannot remove owner (must delete calendar instead)
- Removes from calendar group chat
- Deletes user's pending items for this calendar

---

## Event APIs

### GET /calendars/:calendarId/events
Get events for a specific calendar.

**Query Parameters:**
```typescript
{
  startDate?: string;   // ISO 8601, default: 30 days ago
  endDate?: string;     // ISO 8601, default: 90 days from now
}
```

**Response:** `200 OK`
```typescript
{
  events: CalendarEvent[];
}
```

**Notes:**
- Returns events in date range
- Includes recurring event instances (expanded)
- **TBD:** How to handle recurring events (expand on server vs client?)

---

### GET /events
Get events across multiple calendars (for user).

**Query Parameters:**
```typescript
{
  userId?: string;      // Default: current user
  startDate?: string;
  endDate?: string;
  calendarIds?: string[];  // Filter by specific calendars
}
```

**Response:** `200 OK`
```typescript
{
  events: CalendarEvent[];
}
```

**Notes:**
- Returns events from all calendars user has access to
- Used for "My Events" view and home screen timeline

---

### GET /events/:eventId
Get event details.

**Response:** `200 OK`
```typescript
CalendarEvent
```

**Errors:**
- `403` - User doesn't have access to this event's calendar
- `404` - Event not found

---

### POST /calendars/:calendarId/events
Create new event.

**Request:**
```typescript
{
  title: string;
  description?: string;
  location?: string;
  startTime: string;    // ISO 8601
  endTime: string;      // ISO 8601
  isAllDay: boolean;
  timezone: string;     // IANA timezone
  recurrence?: RecurrenceRule;
  reminders: ReminderOffset[];
  invitedUserIds?: string[];
  designeeId?: string;

  // AI-generated event fields (optional)
  aiGenerated?: boolean;       // true if created from AI parsing
  aiInput?: string;            // raw user input: "dinner with Jordan tomorrow at 7pm"
  aiEditedFields?: string[];   // fields user changed after AI pre-fill
}
```

**Response:** `201 Created`
```typescript
CalendarEvent
```

**Errors:**
- `400` - Validation error (endTime before startTime, etc.)
- `403` - User is not a member of this calendar

**Notes:**
- Creates pending items (event_invite) for invitedUserIds
- Sends event invite messages to calendar group chat
- Sets createdBy to current user
- Triggers `onCalendarUpdate` subscription
- AI fields are stored for RL training (improving AI accuracy over time)

---

### PUT /events/:eventId
Update event.

**Request:**
```typescript
{
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  timezone?: string;
  recurrence?: RecurrenceRule;
  reminders?: ReminderOffset[];
  invitedUserIds?: string[];
  designeeId?: string;
}
```

**Response:** `200 OK`
```typescript
CalendarEvent
```

**Errors:**
- `403` - Only creator (createdBy) can update

**Notes:**
- Creates pending items (event_update) for existing invitees if time/date changes
- Updates invite messages in chat
- Triggers `onCalendarUpdate` subscription

---

### DELETE /events/:eventId
Delete event.

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

**Errors:**
- `403` - Only creator can delete

**Notes:**
- Deletes all related pending items
- Sends notification to invitees
- Removes event invite messages from chat (or marks as cancelled)
- Triggers `onCalendarUpdate` subscription

---

### POST /events/availability
Check availability for multiple users.

**Request:**
```typescript
{
  userIds: string[];
  startTime: string;    // ISO 8601
  endTime: string;      // ISO 8601
}
```

**Response:** `200 OK`
```typescript
{
  availability: {
    userId: string;
    userName: string;
    status: "available" | "busy";
    conflicts: CalendarEvent[];  // Events during proposed time
  }[];
}
```

**Notes:**
- Used by AvailabilityViewer component
- Only checks events in calendars user has access to
- **TBD:** Privacy - should users be able to hide their availability?

---

## AI APIs

### POST /ai/parse
Parse natural language input into structured event data.

**Request:**
```typescript
{
  inputText: string;    // e.g., "dinner with Jordan tomorrow at 7pm"
}
```

**Response:** `200 OK`
```typescript
{
  parseId: string;
  extractedData: {
    title?: string;
    startTime?: string;           // ISO 8601
    endTime?: string;             // ISO 8601
    isAllDay?: boolean;
    location?: string;
    description?: string;
    invitedUserIds?: string[];    // Matched from user's contacts
  };
  confidence: number;             // 0.0 - 1.0
  ambiguities: string[];          // Warnings about uncertain extractions
}
```

**Errors:**
- `400` - Input too long (max 500 chars) or empty
- `429` - Rate limit exceeded (100 requests per user per day)

**Notes:**
- Uses AWS Bedrock (Claude Haiku 4.5 for speed, Sonnet 4.5 for complex requests)
- Provides user context to AI (timezone, contacts, existing calendars)
- Frontend uses this to pre-fill event creation form
- User reviews and can edit before creating event
- Does NOT create the event - that's a separate POST /calendars/:calendarId/events call
- **Future:** Track parse results for RL training (compare extracted data vs final event)

**Example Inputs:**
- "dinner with Jordan tomorrow at 7pm"
- "meeting with Taylor next Monday 2pm"
- "lunch Friday at noon at Starbucks"
- "all day team building event next week"

**Implementation:**
```typescript
// Lambda handler
export async function parseAIInput(userId: string, inputText: string) {
  // Get user context
  const user = await getUser(userId);
  const contacts = await getUserContacts(userId);

  // Build prompt for Claude
  const prompt = `
You are a calendar assistant. Parse this natural language input into structured event data.

User timezone: ${user.timezone}
Current time: ${new Date().toISOString()}
User's contacts: ${contacts.map(c => `${c.name} (@${c.username})`).join(', ')}

Input: "${inputText}"

Extract:
- Event title (infer from context if not explicit)
- Start time (ISO 8601, relative to current time)
- End time (ISO 8601, infer duration based on event type)
- Location (if mentioned)
- Invitees (match to contact usernames)
- Description (if mentioned)

Return JSON only.
  `;

  // Call AWS Bedrock
  const response = await bedrockClient.invokeModel({
    modelId: 'anthropic.claude-haiku-4.5',  // Fast for simple requests
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const parsed = JSON.parse(response.content[0].text);

  return {
    parseId: uuidv4(),
    extractedData: parsed,
    confidence: 0.85
  };
}
```

---

## Chat APIs

### GET /chats
Get all chats for current user.

**Query Parameters:**
```typescript
{
  limit?: number;       // Default 50, max 100
  cursor?: string;      // For pagination
}
```

**Response:** `200 OK`
```typescript
{
  chats: Chat[];
  nextCursor?: string;
}
```

**Notes:**
- Sorted by lastMessageTimestamp (most recent first)
- Includes calendar group chats and direct messages
- unreadCount is per-user

---

### GET /chats/:chatId
Get chat details.

**Response:** `200 OK`
```typescript
Chat
```

**Errors:**
- `403` - User is not a participant
- `404` - Chat not found

---

### POST /chats
Create new direct message chat.

**Request:**
```typescript
{
  type: "direct";
  participantIds: string[];  // Must include current user, exactly 2 participants
}
```

**Response:** `201 Created`
```typescript
Chat
```

**Errors:**
- `400` - Invalid participants (must be exactly 2, must include current user)
- `409` - Direct chat already exists between these users

**Notes:**
- Calendar group chats are auto-created with calendars (cannot create manually)
- Returns existing chat if direct message between users already exists

---

### GET /chats/:chatId/messages
Get messages for a chat.

**Query Parameters:**
```typescript
{
  limit?: number;       // Default 50, max 100
  before?: string;      // Timestamp, load older messages
  after?: string;       // Timestamp, load newer messages
}
```

**Response:** `200 OK`
```typescript
{
  messages: ChatMessage[];
  hasMore: boolean;
}
```

**Notes:**
- Messages sorted by createdAt (newest first by default)
- Use `before` for pagination (load more history)
- Use `after` for polling (check for new messages)

---

### POST /chats/:chatId/messages
Send message to chat.

**Request:**
```typescript
{
  content: string;
  type?: "text" | "event_invite";  // Default "text"
  eventId?: string;     // Required if type is "event_invite"
}
```

**Response:** `201 Created`
```typescript
ChatMessage
```

**Errors:**
- `403` - User is not a participant in this chat
- `400` - Invalid request (eventId missing when type is event_invite)

**Notes:**
- Triggers `onChatMessage` subscription for all participants
- Updates chat.lastMessage and chat.updatedAt
- Increments unreadCount for other participants

---

### PUT /chats/:chatId/messages/:messageId/read
Mark message as read.

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

**Notes:**
- Adds current user to message.readBy array
- Decrements chat.unreadCount for current user
- **TBD:** Batch endpoint for marking multiple messages as read?

---

### PUT /chats/:chatId/read-all
Mark all messages in chat as read.

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

**Notes:**
- Updates all unread messages in one operation
- Resets chat.unreadCount to 0 for current user

---

## Pending Items APIs

### GET /pending-items
Get pending items for current user.

**Query Parameters:**
```typescript
{
  status?: "pending" | "accepted" | "declined";  // Default: "pending"
}
```

**Response:** `200 OK`
```typescript
{
  items: PendingItem[];
}
```

**Notes:**
- Sorted by createdAt (newest first)
- Used for home screen pending items section

---

### GET /pending-items/:itemId
Get pending item details.

**Response:** `200 OK`
```typescript
PendingItem
```

**Errors:**
- `403` - Item doesn't belong to current user
- `404` - Item not found

---

### POST /pending-items/:itemId/accept
Accept pending invitation.

**Response:** `200 OK`
```typescript
{
  item: PendingItem;    // Updated with status: "accepted", respondedAt: timestamp
}
```

**Side Effects by Type:**

**calendar_invite:**
- Adds user to calendar members
- Adds user to calendar group chat
- Triggers `onCalendarUpdate` subscription

**event_invite:**
- Updates inviteStatus in chat messages (eventId match)
- Triggers `onEventInviteUpdate` subscription

**event_update:**
- Updates user's acknowledgment of event changes
- (No side effects on event itself)

---

### POST /pending-items/:itemId/decline
Decline pending invitation.

**Response:** `200 OK`
```typescript
{
  item: PendingItem;    // Updated with status: "declined", respondedAt: timestamp
}
```

**Side Effects by Type:**

**calendar_invite:**
- No action (user not added to calendar)

**event_invite:**
- Updates inviteStatus in chat messages (eventId match)
- Triggers `onEventInviteUpdate` subscription

**event_update:**
- Acknowledges user has seen the update
- (No side effects on event itself)

**Notes:**
- Both accept/decline set respondedAt timestamp
- Frontend filters by status: "pending" to hide responded items

---

## Chat Updates (Polling/Refresh)

**Architecture:** REST API with manual refresh or polling

**For MVP, chat works without real-time features:**
1. User opens chat → `GET /chats/{chatId}/messages` fetches latest messages
2. User sends message → `POST /chats/{chatId}/messages` creates message
3. User manually refreshes → Pull-to-refresh fetches new messages
4. (Optional) Poll for new messages every 5-10 seconds when chat is open

**Advantages:**
- ✅ Simple to implement (no WebSocket complexity)
- ✅ No connection management overhead
- ✅ Works reliably on all networks
- ✅ Lower infrastructure costs
- ✅ Get working faster (focus on core features)

**Tradeoffs:**
- ❌ Not instant (user must refresh or wait for poll)
- ❌ More API calls if polling frequently
- ❌ Slightly higher latency for new messages

**Recommended Flow:**

```typescript
// 1. Load chat on screen mount
useEffect(() => {
  loadMessages();
}, [chatId]);

// 2. Pull-to-refresh for new messages
const onRefresh = async () => {
  await loadMessages();
};

// 3. Optional: Poll when chat is active
useEffect(() => {
  if (isChatOpen) {
    const interval = setInterval(loadMessages, 5000); // Every 5s
    return () => clearInterval(interval);
  }
}, [isChatOpen]);

// 4. Send message (optimistic update)
const sendMessage = async (content) => {
  // Add message to UI immediately
  setMessages(prev => [...prev, optimisticMessage]);

  // Send to server
  const message = await api.post(`/chats/${chatId}/messages`, { content });

  // Replace optimistic message with real one
  setMessages(prev => prev.map(m => m.id === 'temp' ? message : m));
};
```

**Calendar/Event Updates:**
- User navigates to screen → Fetch latest data
- User makes change → Optimistic update + API call
- No need for real-time (calendar changes are infrequent)

**Pending Items:**
- Loaded when Home screen opens
- Refresh when user accepts/declines invitation
- Could add badge notification (next phase)

---

### Optional: Add Real-Time with WebSocket (3 Tables)

**If you want real-time chat later, you can add WebSocket without a 4th table.**

**Architecture:** Store WebSocket connections in PeachyUsers table (no separate table needed)

---

#### WebSocket Setup (Still 3 Tables!)

**Store connections in PeachyUsers table:**
```typescript
// User profile (existing)
{
  PK: "USER#{userId}",
  SK: "METADATA",
  UserId: "user-1",
  Name: "Alex Morgan",
  ...
}

// WebSocket connection (new item type, same table)
{
  PK: "USER#{userId}",
  SK: "CONNECTION#{connectionId}",
  EntityType: "CONNECTION",
  ConnectionId: "abc123xyz",           // API Gateway connectionId
  UserId: "user-1",
  SubscribedChatIds: ["chat-1", "chat-2"],
  SubscribedCalendarIds: ["cal-1"],
  ConnectedAt: "2026-02-14T10:00:00Z",
  LastPingAt: "2026-02-14T10:05:00Z",
  TTL: 1708088400                      // Unix timestamp, auto-delete after 2 hours
}
```

**Add GSI3 to PeachyUsers table:**
```typescript
GSI3: ConnectionId Index
- ConnectionId (Partition Key)
- Use case: Quick lookup/delete when connection closes
```

---

#### WebSocket Endpoints

**Connection URL:** `wss://chat.peachy.app?token={accessToken}`

**Routes:**
- `$connect` → onConnect Lambda
- `$disconnect` → onDisconnect Lambda
- `subscribe` → onSubscribe Lambda
- `$default` → Default handler

---

#### Lambda Functions

**1. onConnect** (when client connects)
```typescript
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters.token;
  const userId = await getUserIdFromToken(token); // Verify JWT

  // Store connection in PeachyUsers table
  await dynamodb.put({
    TableName: 'PeachyUsers',
    Item: {
      PK: `USER#${userId}`,
      SK: `CONNECTION#${connectionId}`,
      EntityType: 'CONNECTION',
      ConnectionId: connectionId,
      UserId: userId,
      SubscribedChatIds: [],
      SubscribedCalendarIds: [],
      ConnectedAt: new Date().toISOString(),
      LastPingAt: new Date().toISOString(),
      TTL: Math.floor(Date.now() / 1000) + 7200  // 2 hours
    }
  });

  return { statusCode: 200 };
};
```

**2. onDisconnect** (when client disconnects)
```typescript
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Find connection using GSI3
  const result = await dynamodb.query({
    TableName: 'PeachyUsers',
    IndexName: 'GSI3-ConnectionId',
    KeyConditionExpression: 'ConnectionId = :connId',
    ExpressionAttributeValues: {
      ':connId': connectionId
    }
  });

  if (result.Items.length > 0) {
    const connection = result.Items[0];

    // Delete connection
    await dynamodb.delete({
      TableName: 'PeachyUsers',
      Key: {
        PK: connection.PK,
        SK: connection.SK
      }
    });
  }

  return { statusCode: 200 };
};
```

**3. onSubscribe** (when client subscribes to chats/calendars)
```typescript
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);

  // Find connection
  const result = await dynamodb.query({
    TableName: 'PeachyUsers',
    IndexName: 'GSI3-ConnectionId',
    KeyConditionExpression: 'ConnectionId = :connId',
    ExpressionAttributeValues: {
      ':connId': connectionId
    }
  });

  const connection = result.Items[0];

  // Update subscriptions
  await dynamodb.update({
    TableName: 'PeachyUsers',
    Key: {
      PK: connection.PK,
      SK: connection.SK
    },
    UpdateExpression: 'SET SubscribedChatIds = :chats, SubscribedCalendarIds = :cals, LastPingAt = :now',
    ExpressionAttributeValues: {
      ':chats': body.chatIds || [],
      ':cals': body.calendarIds || [],
      ':now': new Date().toISOString()
    }
  });

  return { statusCode: 200 };
};
```

**4. broadcastMessage** (called from POST /chats/{id}/messages)
```typescript
exports.broadcastMessage = async (chatId, message) => {
  // 1. Get chat participants from PeachyMain
  const chat = await dynamodb.get({
    TableName: 'PeachyMain',
    Key: {
      PK: `CHAT#${chatId}`,
      SK: 'METADATA'
    }
  });

  const participantIds = chat.Item.ParticipantIds;

  // 2. Get all connections for these users
  const connections = [];
  for (const userId of participantIds) {
    const result = await dynamodb.query({
      TableName: 'PeachyUsers',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CONNECTION#'
      }
    });

    // Filter by subscribed chats
    const userConnections = result.Items.filter(conn =>
      conn.SubscribedChatIds?.includes(chatId)
    );

    connections.push(...userConnections);
  }

  // 3. Broadcast to all connections
  const apiGateway = new ApiGatewayManagementApi({
    endpoint: process.env.WS_ENDPOINT
  });

  const payload = JSON.stringify({
    type: 'chat_message',
    data: message
  });

  for (const conn of connections) {
    try {
      await apiGateway.postToConnection({
        ConnectionId: conn.ConnectionId,
        Data: payload
      });
    } catch (err) {
      if (err.statusCode === 410) {
        // Connection is stale, delete it
        await dynamodb.delete({
          TableName: 'PeachyUsers',
          Key: {
            PK: conn.PK,
            SK: conn.SK
          }
        });
      }
    }
  }
};
```

---

#### Client Integration

**Connect to WebSocket:**
```typescript
const ws = new WebSocket('wss://chat.peachy.app?token=' + accessToken);

ws.onopen = () => {
  // Subscribe to chats
  ws.send(JSON.stringify({
    action: 'subscribe',
    chatIds: ['chat-1', 'chat-2', 'chat-3']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'chat_message') {
    // Add message to chat UI
    addMessageToChat(message.data);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  // Reconnect with exponential backoff
  setTimeout(() => reconnect(), 1000);
};
```

---

#### Cost Comparison

**3-Table WebSocket vs Other Options:**

| Approach | Tables | Monthly Cost (1000 users) | Complexity |
|----------|--------|---------------------------|------------|
| Polling/Refresh | 3 | ~$5 (REST only) | Low |
| WebSocket (3 tables) | 3 | ~$8 (REST + WS) | Medium |
| WebSocket (4 tables) | 4 | ~$8 (REST + WS) | Medium |
| AWS AppSync | 3 | ~$15-20 (GraphQL subs) | Low (managed) |

**Verdict:** WebSocket with 3 tables is the sweet spot — real-time + low cost + manageable complexity.

---

#### Alternative: AWS AppSync (No Lambda Needed)

**If you prefer managed real-time:**
- Use AppSync for GraphQL subscriptions
- Still just 3 DynamoDB tables
- No connection management Lambda code
- Higher cost but easier setup
- Built-in reconnection and offline queue

**Recommendation:**
- **Start with polling** (simplest)
- **Add WebSocket with 3 tables** (if users want real-time)
- **Switch to AppSync** (if Lambda management becomes tedious)

---

### Offline Support (TBD)

**Strategy:**
- Optimistic updates (update UI immediately)
- Queue failed requests (retry on reconnect)
- Conflict resolution (last-write-wins vs CRDTs)

**Local Storage:**
- **AsyncStorage** (React Native) - Key-value store, simple
- **WatermelonDB** (React Native) - SQLite-based, better for complex queries

**Sync Strategy:**
1. User makes change (e.g., create event)
2. Update local DB immediately
3. Queue API request
4. Send request when online
5. On success: Update local DB with server response
6. On conflict: Resolve (TBD - strategy)

**TBD:**
- Full offline architecture design
- Conflict resolution strategy
- Data invalidation strategy

---

## Frontend Integration Checklist

### Phase 1: Authentication ✅
- [ ] Implement Cognito authentication
- [ ] Add login/signup screens
- [ ] Store tokens securely (Expo SecureStore)
- [ ] Auto token refresh on 401

### Phase 2: Core APIs ✅
- [ ] Create API client with axios/fetch
- [ ] Replace CalendarContext with API calls
- [ ] Add error handling (toast notifications)
- [ ] Add loading states to all screens
- [ ] Implement optimistic updates

### Phase 3: Chat & Updates ✅
- [ ] Implement chat message polling or pull-to-refresh
- [ ] Add optimistic updates for sent messages
- [ ] Implement data refresh on screen focus
- [ ] Add loading states for message fetching
- [ ] (Optional) Add 5s polling when chat is open

### Phase 4: File Upload ✅
- [ ] Implement avatar upload flow
- [ ] Add image picker (expo-image-picker)
- [ ] Upload to S3 via presigned URL
- [ ] Show upload progress

### Phase 5: Offline Support 🔄
- [ ] Set up local database (WatermelonDB)
- [ ] Implement sync queue
- [ ] Add offline indicator
- [ ] Handle conflicts

### Phase 6: AI Features 🔄 (TBD)
- [ ] Integrate AI input parsing
- [ ] Add smart scheduling suggestions
- [ ] Implement auto-schedule

---

## API Testing

### Tools
- **Postman/Insomnia** - Manual API testing
- **Jest + Supertest** - Automated integration tests
- **Artillery** - Load testing
- **AWS X-Ray** - Distributed tracing

### Test Scenarios

**Authentication:**
- [ ] Sign up with valid/invalid data
- [ ] Sign in with correct/incorrect credentials
- [ ] Token refresh flow
- [ ] Expired token handling

**Calendars:**
- [ ] Create/update/delete calendar
- [ ] Add/remove members
- [ ] Permission checks (owner vs member)

**Events:**
- [ ] Create event with invitations
- [ ] Update event (check pending items created)
- [ ] Delete event (check cascades)
- [ ] Availability check with conflicts

**Chats:**
- [ ] Send message (check optimistic update)
- [ ] Load message history (pagination)
- [ ] Mark as read (check unread count)
- [ ] Pull-to-refresh for new messages
- [ ] Polling interval (if implemented)

**Load Testing:**
- [ ] 1000 concurrent users
- [ ] 100 messages/second (chat)
- [ ] Event creation throughput

### Security Testing
- [ ] SQL injection (shouldn't be possible with DynamoDB, but test input validation)
- [ ] XSS (sanitize user input)
- [ ] CSRF (use tokens)
- [ ] Authentication bypass
- [ ] Rate limiting enforcement
- [ ] Permission checks (try to access other users' data)

---

## Deployment Considerations

**Environments:**
- `dev` - Development (shared by team, auto-deploy from main branch)
- `prod` - Production (manual approval, deploy from release tags)

**Infrastructure as Code:**
- Use AWS CDK for all resources
- Separate stacks for API, database, auth
- Use SSM Parameter Store for config
- Environment-specific variables via CDK context

**CI/CD Pipeline:**
```yaml
# Push to main branch
1. Run linter (ESLint)
2. Run tests (Jest)
3. Build Lambda functions
4. Deploy to dev (auto)
5. Run integration tests

# Create release tag (v1.0.0)
1. Run full test suite
2. Build optimized bundles
3. Deploy to prod (manual approval)
4. Run smoke tests
```

**Monitoring:**
- CloudWatch Logs (all Lambda functions)
- CloudWatch Metrics (API latency, error rates)
- CloudWatch Alarms (error rate > 1%, latency > 1s)
- **TBD:** AWS X-Ray (distributed tracing - add if needed)

**Rollback Strategy:**
- Keep previous Lambda versions (automatic)
- Use Lambda aliases for instant rollback
- Database migrations: Forward-compatible only (no breaking changes)

**Cost Management:**
- Use DynamoDB On-Demand for `dev` (unpredictable traffic)
- Use DynamoDB Provisioned for `prod` (predictable + cheaper)
- Set CloudWatch log retention: 7 days (dev), 30 days (prod)
- Enable S3 lifecycle policies (delete old uploads after 90 days)
