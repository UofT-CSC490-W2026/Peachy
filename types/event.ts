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
  aiEditedFields?: string[];       // fields user changed after AI pre-fill
}
