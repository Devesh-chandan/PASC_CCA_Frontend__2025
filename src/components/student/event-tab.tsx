'use client';
import { Event } from "@/types/events";
import { useState } from "react";
import { EventCard } from "@/components/student/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const EventsTab = ({ events }: { events: Event[] }) => {
  const [activeTab, setActiveTab] = useState("all-events");

  const filterEvents = (status?: Event['status']) => {
    if (!status) return events;
    return events.filter(event => event.status === status);
  };

  const getTabContent = (tabValue: string) => {
    let filteredEvents = events;
    
    switch (tabValue) {
      case 'upcoming':
        filteredEvents = filterEvents('Upcoming');
        break;
      case 'ongoing':
        filteredEvents = filterEvents('Ongoing');
        break;
      case 'completed':
        filteredEvents = filterEvents('Completed');
        break;
      case 'my-events':
        filteredEvents = events.filter(event => event.rsvpStatus === 'rsvped');
        break;
      default:
        filteredEvents = events;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredEvents.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Full width tabs container with gray background */}
        <div className="w-full  rounded-lg p-1 mb-6">
          <TabsList className="w-full h-auto p-3 flex justify-between items-center bg-gray-100 rounded-lg flex-wrap">
            <TabsTrigger 
              value="all-events" 
              className="text-sm py-1.5 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200"
            >
              All Events
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="text-sm py-1.5 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="text-sm py-1.5 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200"
            >
              Ongoing
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="text-sm py-1.5 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger 
              value="my-events" 
              className="text-sm py-1.5 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200"
            >
              My Events
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all-events" className="mt-0">
          {getTabContent('all-events')}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-0">
          {getTabContent('upcoming')}
        </TabsContent>
        
        <TabsContent value="ongoing" className="mt-0">
          {getTabContent('ongoing')}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {getTabContent('completed')}
        </TabsContent>
        
        <TabsContent value="my-events" className="mt-0">
          {getTabContent('my-events')}
        </TabsContent>
      </Tabs>
    </div>
  );
};