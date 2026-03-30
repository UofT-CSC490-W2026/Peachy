export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO 8601 date
  count?: number;
  byWeekDay?: number[]; // 0 = Sunday, 6 = Saturday
}

export interface ReminderOffset {
  minutes: number;
  method: 'notification' | 'email';
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  isAllDay: boolean;
  timezone: string;
  status: EventStatus;
  recurrence?: RecurrenceRule;
  reminders: ReminderOffset[];
  invitedUserIds: string[];
  designeeId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // AI-generated event fields
  aiGenerated?: boolean;           // true if created from AI parsing
  aiInput?: string;                // raw user input: "plan dinner with Jordan tomorrow at 7pm"
  aiSuggested?: {                  // what AI originally suggested (for ML evaluation)
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    invitedUserIds?: string[];
    confidence?: number;           // AI confidence score (0-1)
    alternatives?: Array<{         // alternative time suggestions
      startTime: string;
      endTime: string;
      reason: string;              // why this alternative was suggested
    }>;
  };
  aiEditedFields?: string[];       // fields user changed after AI pre-fill: ["startTime", "location"]

  // Set when this event was copied from an invitation — points to the original event id
  linkedEventId?: string;
  // Original event creator — only set on linked copies so invitees can see who organised the event
  originalCreatedBy?: string;

  // RSVP status per invitee — only populated on the original event (owner's view)
  // key: userId, value: 'pending' | 'accepted' | 'declined'
  inviteeStatuses?: Record<string, 'pending' | 'accepted' | 'declined'>;
}
