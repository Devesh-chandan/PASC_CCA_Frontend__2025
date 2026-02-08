export type Event = {
  id: number;
  title: string;
  status: EventStatus;
  description: string;
  location: string;
  startDate: string | Date;  // Backend returns Date, can be serialized as string
  endDate: string | Date;    // Backend returns Date, can be serialized as string
  credits: number;
  capacity: number;
  numDays: number;           // Backend field that was missing
  prerequisite?: string;     // Backend uses singular 'prerequisite', not 'prerequisites'
};

export interface Rsvp {
  id: number;
  eventId: number;
  userId: number;
  status: RsvpStatus;
  createdAt: Date | string;
  waitlisted?: boolean;           // Backend has this field
  waitlistPosition?: number | null; // Backend has this field
}

export type RsvpStatus = "ATTENDING" | "NOT_ATTENDING";

export interface EventWithRsvp {
  event: Event;
  rsvp: Rsvp;
}

export type EventFor = 'ADMIN' | 'STUDENT RSVP' | 'STUDENT EVENTS';

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'ALL EVENTS';
