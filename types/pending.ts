export type PendingItemType = 'calendar_invite' | 'event_invite' | 'event_update' | 'friend_request';
export type PendingItemStatus = 'pending' | 'accepted' | 'declined';

export interface PendingItem {
  id: string;
  type: PendingItemType;
  eventId?: string;      // Reference to event (fetch full details separately)
  calendarId?: string;   // Reference to calendar (fetch full details separately)
  fromUserId: string;
  toUserId: string;
  status: PendingItemStatus;
  createdAt: string;
  respondedAt?: string;
}
