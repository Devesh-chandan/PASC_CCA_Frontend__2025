import { useEffect, useState, useCallback } from "react";
import { Event, EventWithRsvp } from "@/types/events";
import { eventAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function formatDateToDDMMYY(dateString: string | Date): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

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
            const formattedEvents = (res.data.data?.events || []).map((event: any) => ({
                ...event,
                startDate: formatDateToDDMMYY(event.startDate),
                endDate: formatDateToDDMMYY(event.endDate),
            }));
            setFetchedEvents(formattedEvents);
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
            const formattedEvents = (res.data.data || []).map((event: any) => ({
                ...event,
                startDate: formatDateToDDMMYY(event.startDate),
                endDate: formatDateToDDMMYY(event.endDate),
            }));
            setFetchedEvents(formattedEvents);
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

