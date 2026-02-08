"use client";

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, ExternalLink } from 'lucide-react';
import { calendarAPI, eventAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [calendarLinks, setCalendarLinks] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getAll({ status: 'UPCOMING' });
      if (response.data?.success && response.data.data) {
        const data = response.data.data as any;
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCalendarLinks = async (eventId: number) => {
    try {
      setSelectedEvent(eventId);
      const response = await calendarAPI.getEventLinks(eventId);
      if (response.data?.success && response.data.data) {
        setCalendarLinks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching calendar links:', error);
    }
  };

  const handleDownloadAll = async () => {
    try {
      // Try to download personalized calendar first
      let response;
      try {
        response = await calendarAPI.downloadMyCalendar();
      } catch (e) {
        console.warn('Failed to download personal calendar, falling back to public:', e);
        response = await calendarAPI.downloadPublicCalendar();
      }

      if (response.data) {
        // Create a blob and download
        const blob = new Blob([response.data as any], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pasc-cca-events.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading calendar:', error);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Calendar Integration
            </h1>
            <p className="text-muted-foreground mt-1">
              Add CCA events to your personal calendar
            </p>
          </div>
          <Button
            onClick={handleDownloadAll}
            className="flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download All Events
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use Calendar Integration
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Click on any event below to get calendar links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Choose your preferred calendar app (Google Calendar, Outlook, or download .ics file)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>The event will be automatically added with all details and reminders</span>
            </li>
          </ul>
        </div>

        {/* Events List */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div
                  key={event.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDateTime(event.startDate)}
                        </span>
                        <span>📍 {event.location}</span>
                        <span>⭐ {event.credits} credits</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGetCalendarLinks(event.id)}
                      variant={selectedEvent === event.id ? "default" : "outline"}
                      size="sm"
                    >
                      Add to Calendar
                    </Button>
                  </div>

                  {/* Calendar Links */}
                  {selectedEvent === event.id && calendarLinks && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-3">Choose your calendar:</p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={calendarLinks.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Google Calendar
                        </a>
                        <a
                          href={calendarLinks.outlook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Outlook
                        </a>
                        <a
                          href={calendarLinks.ical}
                          download
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download .ics
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


