import { Calendar, CalendarEvent, User, Chat, ChatMessage, PendingItem } from '@/types';

// Current user
export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Morgan',
  username: 'alexmorgan',
  email: 'alex.morgan@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Contacts
export const contacts: User[] = [
  {
    id: 'user-2',
    name: 'Jordan Lee',
    username: 'jordanlee',
    email: 'jordan.lee@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    name: 'Taylor Smith',
    username: 'taylorsmith',
    email: 'taylor.smith@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-4',
    name: 'Casey Johnson',
    username: 'caseyjohnson',
    email: 'casey.johnson@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Calendars
export const mockCalendars: Calendar[] = [
  {
    id: 'cal-1',
    name: 'Personal',
    color: '#FF8C6B',
    type: 'personal',
    description: 'My personal calendar',
    ownerId: currentUser.id,
    memberIds: [currentUser.id],
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-2',
    name: 'Work',
    color: '#4A90E2',
    type: 'shared',
    description: 'Work events and meetings',
    ownerId: currentUser.id,
    memberIds: [currentUser.id, 'user-2', 'user-3'],
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-3',
    name: 'Family',
    color: '#9B59B6',
    type: 'shared',
    description: 'Family events',
    ownerId: currentUser.id,
    memberIds: [currentUser.id, 'user-4'],
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cal-4',
    name: 'Fitness',
    color: '#2ECC71',
    type: 'personal',
    description: 'Workouts and fitness',
    ownerId: currentUser.id,
    memberIds: [currentUser.id],
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to get date relative to today
function getRelativeDate(daysOffset: number, hour: number = 9, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Events
export const mockEvents: CalendarEvent[] = [
  // Today's events
  {
    id: 'event-1',
    calendarId: 'cal-2',
    title: 'Team Standup',
    description: 'Daily team sync',
    startTime: getRelativeDate(0, 9, 0).toISOString(),
    endTime: getRelativeDate(0, 9, 30).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    recurrence: {
      frequency: 'daily',
      interval: 1,
      byWeekDay: [1, 2, 3, 4, 5], // Weekdays only
    },
    reminders: [{ minutes: 10, method: 'notification' }],
    invitedUserIds: ['user-2', 'user-3'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    calendarId: 'cal-1',
    title: 'Dentist Appointment',
    location: '123 Main St, Suite 200',
    startTime: getRelativeDate(0, 14, 0).toISOString(),
    endTime: getRelativeDate(0, 15, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [
      { minutes: 60, method: 'notification' },
      { minutes: 1440, method: 'notification' },
    ],
    invitedUserIds: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-3',
    calendarId: 'cal-4',
    title: 'Gym Session',
    location: 'LA Fitness',
    startTime: getRelativeDate(0, 18, 0).toISOString(),
    endTime: getRelativeDate(0, 19, 30).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      byWeekDay: [1, 3, 5], // Mon, Wed, Fri
    },
    reminders: [{ minutes: 30, method: 'notification' }],
    invitedUserIds: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Tomorrow
  {
    id: 'event-4',
    calendarId: 'cal-3',
    title: 'Dinner with Family',
    location: 'Olive Garden',
    startTime: getRelativeDate(1, 19, 0).toISOString(),
    endTime: getRelativeDate(1, 21, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [{ minutes: 120, method: 'notification' }],
    invitedUserIds: ['user-4'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // This week
  {
    id: 'event-5',
    calendarId: 'cal-2',
    title: 'Project Review',
    description: 'Q1 project review meeting',
    location: 'Conference Room B',
    startTime: getRelativeDate(2, 10, 0).toISOString(),
    endTime: getRelativeDate(2, 12, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [{ minutes: 30, method: 'notification' }],
    invitedUserIds: ['user-2', 'user-3'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-6',
    calendarId: 'cal-1',
    title: 'Book Club',
    location: 'Coffee Bean',
    startTime: getRelativeDate(3, 18, 30).toISOString(),
    endTime: getRelativeDate(3, 20, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [{ minutes: 60, method: 'notification' }],
    invitedUserIds: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-7',
    calendarId: 'cal-2',
    title: 'Client Presentation',
    description: 'Present Q1 results to client',
    location: 'Zoom',
    startTime: getRelativeDate(4, 14, 0).toISOString(),
    endTime: getRelativeDate(4, 15, 30).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [
      { minutes: 30, method: 'notification' },
      { minutes: 1440, method: 'email' },
    ],
    invitedUserIds: ['user-2'],
    designeeId: currentUser.id,
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Next week
  {
    id: 'event-8',
    calendarId: 'cal-3',
    title: "Mom's Birthday",
    startTime: getRelativeDate(7, 0, 0).toISOString(),
    endTime: getRelativeDate(7, 23, 59).toISOString(),
    isAllDay: true,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    recurrence: {
      frequency: 'yearly',
      interval: 1,
    },
    reminders: [
      { minutes: 1440, method: 'notification' },
      { minutes: 10080, method: 'notification' }, // 1 week before
    ],
    invitedUserIds: ['user-4'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-9',
    calendarId: 'cal-2',
    title: '1-on-1 with Manager',
    location: 'Office',
    startTime: getRelativeDate(8, 15, 0).toISOString(),
    endTime: getRelativeDate(8, 16, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    recurrence: {
      frequency: 'weekly',
      interval: 2, // Every 2 weeks
    },
    reminders: [{ minutes: 15, method: 'notification' }],
    invitedUserIds: ['user-2'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-10',
    calendarId: 'cal-4',
    title: 'Morning Run',
    location: 'Central Park',
    startTime: getRelativeDate(9, 7, 0).toISOString(),
    endTime: getRelativeDate(9, 8, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      byWeekDay: [0, 6], // Sat, Sun
    },
    reminders: [{ minutes: 15, method: 'notification' }],
    invitedUserIds: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Further out
  {
    id: 'event-11',
    calendarId: 'cal-1',
    title: 'Concert Tickets',
    description: 'Taylor Swift - The Eras Tour',
    location: 'SoFi Stadium',
    startTime: getRelativeDate(14, 19, 30).toISOString(),
    endTime: getRelativeDate(14, 23, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [
      { minutes: 120, method: 'notification' },
      { minutes: 1440, method: 'notification' },
    ],
    invitedUserIds: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-12',
    calendarId: 'cal-2',
    title: 'Product Launch',
    description: 'V2.0 product launch event',
    location: 'Company HQ',
    startTime: getRelativeDate(21, 9, 0).toISOString(),
    endTime: getRelativeDate(21, 17, 0).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'tentative',
    reminders: [
      { minutes: 1440, method: 'email' },
      { minutes: 10080, method: 'email' },
    ],
    invitedUserIds: ['user-2', 'user-3'],
    designeeId: 'user-2',
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-13',
    calendarId: 'cal-2',
    title: 'Team Lunch',
    description: 'Team lunch to celebrate project milestone',
    location: 'Downtown Cafe',
    startTime: getRelativeDate(4, 12, 0).toISOString(), // Friday at noon
    endTime: getRelativeDate(4, 13, 30).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [{ minutes: 60, method: 'notification' }],
    invitedUserIds: [currentUser.id, 'user-2', 'user-3'],
    createdBy: 'user-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // AI fields for ML evaluation
    aiGenerated: true,
    aiInput: 'lunch with the team this Friday',
    aiSuggested: {
      title: 'Team Lunch',
      startTime: getRelativeDate(4, 12, 0).toISOString(), // AI got time right
      endTime: getRelativeDate(4, 13, 30).toISOString(),
      location: 'Office Cafeteria', // AI suggested office cafeteria
      invitedUserIds: [currentUser.id, 'user-2', 'user-3'],
      confidence: 0.88,
      alternatives: [
        {
          startTime: getRelativeDate(4, 11, 30).toISOString(),
          endTime: getRelativeDate(4, 13, 0).toISOString(),
          reason: 'Earlier lunch (11:30am)',
        },
        {
          startTime: getRelativeDate(4, 13, 0).toISOString(),
          endTime: getRelativeDate(4, 14, 30).toISOString(),
          reason: 'Later lunch (1pm)',
        },
      ],
    },
    aiEditedFields: ['location'], // User changed from Office Cafeteria to Downtown Cafe
  },
  // AI-generated event (example with ML evaluation data)
  {
    id: 'event-14',
    calendarId: 'cal-1',
    title: 'Coffee with Jordan',
    location: 'Blue Bottle Coffee',
    startTime: getRelativeDate(1, 10, 30).toISOString(), // Tomorrow at 10:30am (user changed from 10am)
    endTime: getRelativeDate(1, 11, 30).toISOString(),
    isAllDay: false,
    timezone: 'America/Los_Angeles',
    status: 'confirmed',
    reminders: [{ minutes: 30, method: 'notification' }],
    invitedUserIds: ['user-2'],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // AI fields for ML evaluation
    aiGenerated: true,
    aiInput: 'coffee with Jordan tomorrow morning',
    aiSuggested: {
      title: 'Coffee with Jordan',
      startTime: getRelativeDate(1, 10, 0).toISOString(), // AI suggested 10am
      endTime: getRelativeDate(1, 11, 0).toISOString(),
      location: 'Starbucks', // AI suggested Starbucks
      invitedUserIds: ['user-2'],
      confidence: 0.87,
      alternatives: [
        {
          startTime: getRelativeDate(1, 9, 0).toISOString(),
          endTime: getRelativeDate(1, 10, 0).toISOString(),
          reason: 'Earlier option (9am)',
        },
        {
          startTime: getRelativeDate(1, 11, 0).toISOString(),
          endTime: getRelativeDate(1, 12, 0).toISOString(),
          reason: 'Later option (11am)',
        },
      ],
    },
    aiEditedFields: ['startTime', 'location'], // User changed time and location
  },
];

// Chat messages
const workChatLastMessage: ChatMessage = {
  id: 'msg-1',
  chatId: 'chat-1',
  senderId: 'user-2',
  content: "Team Lunch - Team lunch to celebrate project milestone on Friday at 12:00 PM",
  type: 'event_invite',
  eventId: 'event-13',
  inviteStatus: 'pending',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
};

const familyChatLastMessage: ChatMessage = {
  id: 'msg-2',
  chatId: 'chat-2',
  senderId: 'user-4',
  content: "Dinner with Family - Join us for dinner tomorrow at 7:00 PM",
  type: 'event_invite',
  eventId: 'event-4',
  inviteStatus: 'pending',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
};

const dmLastMessage: ChatMessage = {
  id: 'msg-3',
  chatId: 'chat-3',
  senderId: 'user-3',
  content: 'Can we reschedule our meeting?',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  readBy: ['user-3'],
};

// Chats
export const mockChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'calendar_group',
    name: 'Work',
    calendarId: 'cal-2',
    participantIds: [currentUser.id, 'user-2', 'user-3'],
    lastMessage: workChatLastMessage,
    unreadCount: 2,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: workChatLastMessage.createdAt,
  },
  {
    id: 'chat-2',
    type: 'calendar_group',
    name: 'Family',
    calendarId: 'cal-3',
    participantIds: [currentUser.id, 'user-4'],
    lastMessage: familyChatLastMessage,
    unreadCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: familyChatLastMessage.createdAt,
  },
  {
    id: 'chat-3',
    type: 'direct',
    name: 'Taylor Smith',
    participantIds: [currentUser.id, 'user-3'],
    lastMessage: dmLastMessage,
    unreadCount: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: dmLastMessage.createdAt,
  },
];

// Pending items
export const mockPendingItems: PendingItem[] = [
  {
    id: 'pending-1',
    type: 'calendar_invite',
    calendarId: 'cal-5', // Reference - fetch full calendar details separately
    fromUserId: 'user-2',
    toUserId: currentUser.id,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'pending-2',
    type: 'event_invite',
    calendarId: 'cal-2',
    eventId: 'event-13', // Reference - fetch full event details separately
    fromUserId: 'user-2',
    toUserId: currentUser.id,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
  },
  {
    id: 'pending-3',
    type: 'event_invite',
    calendarId: 'cal-3',
    eventId: 'event-4', // Reference - fetch full event details separately
    fromUserId: 'user-4',
    toUserId: currentUser.id,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
];
