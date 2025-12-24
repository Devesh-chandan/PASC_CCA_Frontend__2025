export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
  credits: number;
}

export interface CalendarLinks {
  ical: string;
  google: string;
  outlook: string;
}

export interface CalendarResponse {
  success: boolean;
  data?: CalendarLinks;
  message?: string;
  error?: string;
}

