export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'YEARLY' | 'ALL_TIME';

export interface LeaderboardEntry {
  id: number;
  userId: number;
  rank: number;
  credits: number;
  eventsAttended: number;
  period: LeaderboardPeriod;
  year: number;
  month?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: number;
    name?: string;
    email: string;
    department: string;
    year: number;
  };
}

export interface LeaderboardResponse {
  success: boolean;
  data?: LeaderboardEntry[];
  message?: string;
  error?: string;
}

