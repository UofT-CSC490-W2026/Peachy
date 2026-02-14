export type ChatType = 'direct' | 'calendar_group';
export type MessageType = 'text' | 'event_invite';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  eventId?: string;
  inviteStatus?: InviteStatus;
  createdAt: string;
  readBy: string[];
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  calendarId?: string; // For calendar group chats
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
