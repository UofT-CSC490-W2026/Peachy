export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface Friend {
  userId: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  friendsSince: string;
}
