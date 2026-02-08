export interface UserAttendanceStats {
  sessionsAttended: number;
  sessions: AttendanceSession[];
  totalCredits: number;
  completionRate: number;
  userPersonalBest: UserPersonalBest;
}

export interface AttendanceSession {
  id?: number;
  eventId: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  sessionName: string;
  code: string;
  location: string;
  credits: number;
}


export interface UserPersonalBest {
  sessionId: number;
  userId: number;
  credits: number;
}

interface AttendanceSessionForUser {
  id?: number;
  eventId: number;
  startTime?: Date | null;
  endTime?: Date | null;
  isActive: boolean;
  sessionName: string;
  location: string;
  credits: number;
  attened: boolean;
}

export interface EventAttendanceSessionForUser {
  event: Event;
  session: AttendanceSessionForUser[];
}
