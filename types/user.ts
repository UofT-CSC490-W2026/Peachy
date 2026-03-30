export interface User {
  id: string; // Cognito sub
  name: string;
  username: string; // Unique, used for search and @mentions
  email: string; // Unique, used for login
  avatarUrl?: string;
  interests?: string[];
  googleCalendarLinked?: boolean; // Set by backend after Google Calendar OAuth // Array of interest tag IDs (e.g. ["running","hiking"])
  createdAt: string;
  updatedAt: string;
}
