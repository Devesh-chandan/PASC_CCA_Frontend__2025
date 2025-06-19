export type Event = {
    id: number;
  title: string;
  status: "Upcoming" | "Completed" | "Ongoing";
  description: string;
  duration: string;
  location: string;
  startDate: string;
  endDate: string;
  creditHours: string;
  rsvpStatus: "not_rsvped" | "rsvped" | "disabled";
  aboutEvent?: string;      // Detailed description for "About Event" section
  prerequisites?: string;   // Prerequisites text
  contact?: string;        
};