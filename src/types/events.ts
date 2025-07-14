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
  // 'prerequisites' is now the only field for event requirements. 'aboutEvent' has been removed.
  prerequisites?: string;
  contact?: string;
};
