"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Star } from 'lucide-react';
import { eventAPI, rsvpAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewSection } from '@/components/events/ReviewSection';
import { ResourceSection } from '@/components/events/ResourceSection';
import { GallerySection } from '@/components/events/GallerySection';
import { formatDateTime } from '@/lib/utils';

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number>(0);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const numId = parseInt(id);
      setEventId(numId);
      fetchEvent(numId);
      checkRsvpStatus(numId);
    };
    init();
  }, [params]);

  const fetchEvent = async (id: number) => {
    try {
      const response = await eventAPI.getById(id);
      if (response.data?.success && response.data.data) {
        setEvent(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRsvpStatus = async (id: number) => {
    try {
      const response = await rsvpAPI.getUserRsvps();
      if (response.data?.success && response.data.data) {
        const rsvps = response.data.data as any[];
        const eventRsvp = rsvps.find((r: any) => r.eventId === id);
        if (eventRsvp) {
          setRsvpStatus(eventRsvp.status);
        }
      }
    } catch (error) {
      console.error('Error checking RSVP:', error);
    }
  };

  const handleRsvp = async () => {
    setRsvpLoading(true);
    try {
      if (rsvpStatus === 'ATTENDING') {
        await rsvpAPI.cancel(eventId);
        setRsvpStatus(null);
      } else {
        await rsvpAPI.create(eventId);
        setRsvpStatus('ATTENDING');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Event Not Found</h2>
          <p className="text-muted-foreground mt-2">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        {/* Event Header */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {event.imageUrl && (
            <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
                  <Badge variant={event.status === 'UPCOMING' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">{event.description}</p>
              </div>
              <Button
                onClick={handleRsvp}
                disabled={rsvpLoading || event.status === 'COMPLETED'}
                className={rsvpStatus === 'ATTENDING' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {rsvpLoading ? 'Loading...' : rsvpStatus === 'ATTENDING' ? 'Cancel RSVP' : 'RSVP Now'}
              </Button>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDateTime(event.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDateTime(event.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="font-medium">{event.credits} hours</p>
                </div>
              </div>
            </div>

            {event.prerequisite && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Prerequisites
                </h3>
                <p className="text-blue-800 dark:text-blue-200">{event.prerequisite}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs for Reviews, Resources, Gallery */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Users className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Calendar className="w-4 h-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <ReviewSection eventId={eventId} eventStatus={event.status} />
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Event Resources</h2>
              <ResourceSection eventId={eventId} />
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Event Gallery</h2>
              <GallerySection eventId={eventId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

