export type ChatType = 'direct' | 'calendar_group';
export type MessageType = 'text' | 'event_invite' | 'system';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type ChatStatus = 'active' | 'request';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  eventId?: string;
  inviteStatus?: InviteStatus;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  calendarId?: string; // For calendar group chats
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  status: ChatStatus;
  requestedBy?: string;
  hasAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
}
