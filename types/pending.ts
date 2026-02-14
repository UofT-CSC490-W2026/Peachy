export type PendingItemType = 'calendar_invite' | 'event_invite' | 'event_update';
export type PendingItemStatus = 'pending' | 'accepted' | 'declined';

export interface PendingItem {
  id: string;
  type: PendingItemType;
  title: string;
  description: string;
  calendarId?: string;
  eventId?: string;
  fromUserId: string;
  toUserId: string;
  status: PendingItemStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}
