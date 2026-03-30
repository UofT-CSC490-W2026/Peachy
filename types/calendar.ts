export type CalendarType = 'personal' | 'shared';

export interface Calendar {
  id: string;
  name: string;
  color: string;
  type: CalendarType;
  description?: string;
  ownerId: string;
  memberIds: string[];
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  googleCalendarId?: string;
}
