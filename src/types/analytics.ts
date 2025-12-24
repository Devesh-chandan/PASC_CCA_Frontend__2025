export interface EventAnalytics {
  eventId: number;
  eventTitle: string;
  totalRsvps: number;
  confirmedRsvps: number;
  waitlistedRsvps: number;
  totalAttendance: number;
  attendanceRate: number;
  averageRating?: number;
  totalReviews: number;
  creditsDistributed: number;
  sessionStats: {
    sessionId: number;
    sessionName: string;
    attendanceCount: number;
    credits: number;
  }[];
}

export interface DashboardAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalUsers: number;
  totalRsvps: number;
  totalAttendance: number;
  totalCreditsDistributed: number;
  averageEventRating: number;
  topEvents: {
    id: number;
    title: string;
    attendanceCount: number;
    rating: number;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string | Date;
  }[];
}

export interface AnalyticsResponse {
  success: boolean;
  data?: EventAnalytics | DashboardAnalytics;
  message?: string;
  error?: string;
}

