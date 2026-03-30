export interface User {
  id: string; // Cognito sub
  name: string;
  username: string; // Unique, used for search and @mentions
  email: string; // Unique, used for login
  avatarUrl?: string;
  bio?: string;
  interests?: string[];
  googleCalendarLinked?: boolean; // Set by backend after Google Calendar OAuth
  createdAt: string;
  updatedAt: string;
}
