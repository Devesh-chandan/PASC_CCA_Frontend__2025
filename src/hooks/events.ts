import { useEffect, useState, useCallback } from "react";
import { Event, EventWithRsvp } from "@/types/events";
import { eventAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";


export function useFetchEventsForAdmin() {
    const [fetchedEvents, setFetchedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use public events endpoint for admin dashboard
            const res = await eventAPI.getAll();
            // Pass through raw ISO date strings - let components format them
            const events = res.data.data?.events || [];
            setFetchedEvents(events);
        } catch (err) {
            setError("Failed to fetch events");
            setFetchedEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events: fetchedEvents, loading, error, refetchEvents: fetchEvents };
}

export function useFetchEventsForStudentRsvp() {
    const [fetchedEvents, setFetchedEvents] = useState<EventWithRsvp[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const role = useAuthStore(state => state.role);

    const fetchEvents = useCallback(async () => {
        if (role !== 'student') {
            setLoading(false);
            setFetchedEvents([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Use user events endpoint - returns events with RSVP status
            const res = await eventAPI.getUserEvents();
            // Pass through raw ISO date strings - let components format them
            const events = res.data.data || [];
            setFetchedEvents(events);
        } catch (err) {
            setError("Failed to fetch events");
            console.error(err);
            setFetchedEvents([]);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, role]);

    return { events: fetchedEvents, loading, error, refetchEvents: fetchEvents };
}

