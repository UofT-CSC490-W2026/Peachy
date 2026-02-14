export interface User {
  id: string; // Cognito sub
  name: string;
  username: string; // Unique, used for search and @mentions
  email: string; // Unique, used for login
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
