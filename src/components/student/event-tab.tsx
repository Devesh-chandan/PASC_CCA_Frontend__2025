'use client';
import { EventWithRsvp } from "@/types/events";
import { useState } from "react";
import { EventCard } from "@/components/student/event-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";

export const EventsTab = ({ eventsWithRsvp }: { eventsWithRsvp: EventWithRsvp[] }) => {
  const [activeTab, setActiveTab] = useState("all-events");
  const [searchQuery, setSearchQuery] = useState("");

  const filterEvents = (status?: string) => {
    let filtered = eventsWithRsvp;

    // Filter by status
    if (status && status !== "all-events") {
      filtered = filtered.filter(e => e.event.status === status.toUpperCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.event.title.toLowerCase().includes(query) ||
        e.event.description.toLowerCase().includes(query) ||
        e.event.location.toLowerCase().includes(query)

      );
    }

    return filtered;
  };

  const getTabContent = (tabValue: string) => {
    const filteredEvents = filterEvents(tabValue);

    if (filteredEvents.length === 0) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery ? 'Try adjusting your search' : 'Check back later for new events'}
          </p>
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((eventWithRsvp, index) => (
            <EventCard key={eventWithRsvp.event.id || index} eventWithRsvp={eventWithRsvp} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Full width tabs container with gray background */}
        <div className="w-full rounded-lg p-1 mb-6">
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
      </Tabs>
    </div>
  );
};