export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'YEARLY' | 'ALL_TIME';

// Backend returns flat structure, not nested user object
export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;      // Backend returns this directly
  department: string;    // Backend returns this directly
  year: number;          // Backend returns this directly
  credits: number;
  eventsAttended: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data?: LeaderboardEntry[];
  message?: string;
  error?: string;
}


