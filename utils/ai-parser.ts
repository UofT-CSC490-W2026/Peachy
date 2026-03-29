/**
 * Types for the AI parse API response.
 * Parsing is done server-side by AWS Bedrock (Claude) — see Peachy-Infra/lambda/ai/parse/.
 */

export interface ParsedEventData {
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string | null;
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
