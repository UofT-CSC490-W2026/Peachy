/**
 * AI Parser - Mock implementation for natural language event parsing
 * In production, this will call AWS Bedrock (Claude Haiku/Sonnet)
 */

import { contacts } from '@/data/mock-data';

export interface ParsedEventData {
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  invitedUserIds?: string[];
  isAllDay?: boolean;
}

export interface AIParseResult {
  parseId: string;
  extractedData: ParsedEventData;
  confidence: number;
  ambiguities: string[];
}

/**
 * Mock AI parser - simulates AWS Bedrock parsing
 * Handles common patterns like:
 * - "dinner with Jordan tomorrow at 7pm"
 * - "meeting with Taylor next Monday 2pm"
 * - "lunch Friday at noon"
 */
export function mockAIParse(inputText: string): AIParseResult {
  const input = inputText.toLowerCase().trim();
  const extractedData: ParsedEventData = {};
  const ambiguities: string[] = [];

  // Parse event title
  extractedData.title = parseTitle(input);

  // Parse time
  const timeData = parseTime(input);
  extractedData.startTime = timeData.startTime;
  extractedData.endTime = timeData.endTime;
  extractedData.isAllDay = timeData.isAllDay;

  // Parse location
  extractedData.location = parseLocation(input);

  // Parse invitees
  const inviteeData = parseInvitees(input);
  extractedData.invitedUserIds = inviteeData.userIds;
  if (inviteeData.ambiguity) {
    ambiguities.push(inviteeData.ambiguity);
  }

  // Generate parse ID
  const parseId = `parse-${Date.now()}`;

  return {
    parseId,
    extractedData,
    confidence: 0.85,
    ambiguities,
  };
}

/**
 * Extract event title from input
 */
function parseTitle(input: string): string {
  // Remove common time words to get the core event
  const timeWords = /\b(today|tomorrow|tonight|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at|am|pm|\d+:\d+|\d+pm|\d+am)\b/gi;
  const withWords = /\bwith\b/gi;

  let title = input.replace(timeWords, '').replace(withWords, '').trim();

  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // If title is empty or too short, use a default
  if (!title || title.length < 2) {
    title = 'New Event';
  }

  return title;
}

/**
 * Parse date and time from input
 */
function parseTime(input: string): {
  startTime: string;
  endTime: string;
  isAllDay: boolean;
} {
  const now = new Date();
  let targetDate = new Date(now);
  let hour = 9; // Default to 9am
  let minute = 0;
  let isAllDay = false;

  // Parse relative dates
  if (input.includes('today')) {
    // Keep current date
  } else if (input.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (input.includes('tonight')) {
    hour = 19; // 7pm for tonight
  } else if (input.includes('next week')) {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (input.includes('next month')) {
    targetDate.setMonth(targetDate.getMonth() + 1);
  }

  // Parse day of week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  days.forEach((day, index) => {
    if (input.includes(day)) {
      const currentDay = targetDate.getDay();
      const targetDay = index;
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next week
      }
      targetDate.setDate(targetDate.getDate() + daysToAdd);
    }
  });

  // Parse specific times
  // Match patterns like "7pm", "7:30pm", "19:00"
  const timeMatch = input.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

    const meridiem = timeMatch[4]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    } else if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }
  } else if (input.includes('noon') || input.includes('lunch')) {
    hour = 12;
  } else if (input.includes('dinner')) {
    hour = 19; // 7pm
  } else if (input.includes('breakfast')) {
    hour = 8;
  } else if (input.includes('morning')) {
    hour = 9;
  } else if (input.includes('afternoon')) {
    hour = 14; // 2pm
  } else if (input.includes('evening')) {
    hour = 18; // 6pm
  }

  // Check if all-day event
  if (input.includes('all day') || input.includes('birthday') || input.includes('holiday')) {
    isAllDay = true;
    hour = 0;
    minute = 0;
  }

  // Set start time
  targetDate.setHours(hour, minute, 0, 0);
  const startTime = targetDate.toISOString();

  // Set end time (default 1 hour later, or 2 hours for dinner/lunch)
  const endDate = new Date(targetDate);
  if (isAllDay) {
    endDate.setHours(23, 59, 59, 999);
  } else if (input.includes('dinner') || input.includes('lunch')) {
    endDate.setHours(endDate.getHours() + 1, endDate.getMinutes() + 30); // 1.5 hours
  } else {
    endDate.setHours(endDate.getHours() + 1); // 1 hour
  }
  const endTime = endDate.toISOString();

  return { startTime, endTime, isAllDay };
}

/**
 * Parse location from input
 */
function parseLocation(input: string): string | undefined {
  // Look for "at X" pattern
  const atMatch = input.match(/\bat\s+([^,\.]+?)(?:\s+(?:today|tomorrow|tonight|next|on|at\s+\d))/i);
  if (atMatch) {
    return atMatch[1].trim();
  }

  // Look for specific locations
  if (input.includes('zoom') || input.includes('online')) {
    return 'Zoom';
  }
  if (input.includes('office')) {
    return 'Office';
  }
  if (input.includes('home')) {
    return 'Home';
  }

  return undefined;
}

/**
 * Parse invitees from input
 */
function parseInvitees(input: string): {
  userIds: string[];
  ambiguity?: string;
} {
  const userIds: string[] = [];
  let ambiguity: string | undefined;

  // Look for "with X" pattern
  const withMatch = input.match(/\bwith\s+([^,\.]+?)(?:\s+(?:today|tomorrow|at|on|next))/i);
  if (!withMatch) {
    return { userIds };
  }

  const names = withMatch[1].toLowerCase().trim();

  // Try to match against contacts
  const matchedContacts = contacts.filter(contact => {
    const nameLower = contact.name.toLowerCase();
    const firstNameLower = contact.name.split(' ')[0].toLowerCase();
    return names.includes(nameLower) || names.includes(firstNameLower);
  });

  if (matchedContacts.length === 1) {
    userIds.push(matchedContacts[0].id);
  } else if (matchedContacts.length > 1) {
    // Multiple matches - pick first one but note ambiguity
    userIds.push(matchedContacts[0].id);
    ambiguity = `Multiple contacts named "${names}" - selected @${matchedContacts[0].username}`;
  }

  return { userIds, ambiguity };
}
