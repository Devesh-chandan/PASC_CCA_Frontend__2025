"use client";

import { useState, useEffect } from 'react';
import { Download, Users, Mail, GraduationCap } from 'lucide-react';
import { rsvpAPI } from '@/lib/api';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface AttendeeListProps {
    eventId: number;
}

export function AttendeeList({ eventId }: AttendeeListProps) {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendees();
    }, [eventId]);

    const fetchAttendees = async () => {
        try {
            const response = await rsvpAPI.getEventRsvps(eventId);
            if (response.data?.success && response.data.data) {
                setAttendees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching attendees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (attendees.length === 0) return;

        const headers = ['Name', 'Email', 'Department', 'Year', 'Status', 'RSVP Date'];
        const csvData = attendees.map(a => [
            a.user.name,
            a.user.email,
            a.user.department,
            a.user.year,
            a.status,
            new Date(a.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendees_event_${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (attendees.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No attendees yet</p>
                <p className="text-sm">When students RSVP, they will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Registered Attendees ({attendees.length})
                </h3>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Department & Year</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">RSVP Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {attendees.map((attendee) => (
                            <tr key={attendee.id} className="hover:bg-accent/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-foreground">{attendee.user.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {attendee.user.email}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" />
                                            {attendee.user.department}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Year {attendee.user.year}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${attendee.status === 'ATTENDING' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {attendee.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(attendee.rsvpDate).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        timeZone: 'UTC'
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
