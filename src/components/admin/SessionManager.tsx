"use client";

import { useState, useEffect } from 'react';
import { Plus, Clock, MapPin, Key, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { attendanceAPI } from '@/lib/api';
import { AttendanceSession } from '@/types/attendance';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

interface SessionManagerProps {
    eventId: number;
    eventStartDate?: string;
    eventEndDate?: string;
}

export function SessionManager({ eventId, eventStartDate, eventEndDate }: SessionManagerProps) {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        sessionName: '',
        location: '',
        credits: 1,
        startTime: '',
        endTime: '',
        code: '',
    });

    useEffect(() => {
        fetchSessions();
    }, [eventId]);

    const fetchSessions = async () => {
        try {
            const response = await attendanceAPI.getEventSessions(eventId);
            if (response.data?.success && response.data.data) {
                setSessions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: extract YYYY-MM-DD from a datetime-local string or date string
    const toDateOnly = (val: string): string => {
        // datetime-local is "YYYY-MM-DDTHH:mm", date input is "YYYY-MM-DD"
        return val.split('T')[0];
    };

    const handleAddSession = async () => {
        if (!formData.sessionName) return;

        // Require startTime
        if (!formData.startTime) {
            setDateError('Session start time is required.');
            return;
        }

        // Client-side date range validation (compare dates only, ignore time-of-day)
        if (eventStartDate && eventEndDate) {
            const evStartStr = toDateOnly(eventStartDate); // "YYYY-MM-DD"
            const evEndStr = toDateOnly(eventEndDate);     // "YYYY-MM-DD"

            const sessStartStr = toDateOnly(formData.startTime);
            if (sessStartStr < evStartStr || sessStartStr > evEndStr) {
                setDateError(`Session start date must be between ${evStartStr} and ${evEndStr}`);
                return;
            }

            if (formData.endTime) {
                const sessEndStr = toDateOnly(formData.endTime);
                if (sessEndStr < evStartStr || sessEndStr > evEndStr) {
                    setDateError(`Session end date must be between ${evStartStr} and ${evEndStr}`);
                    return;
                }
            }
        }
        setDateError(null);
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
                endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
                isActive: true,
            };
            const response = await attendanceAPI.createSession(eventId, payload);
            if (response.data?.success) {
                setIsAdding(false);
                setFormData({ sessionName: '', location: '', credits: 1, startTime: '', endTime: '', code: '' });
                setDateError(null);
                fetchSessions();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Failed to create session';
            setDateError(msg);
            console.error('Error adding session:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (session: AttendanceSession) => {
        try {
            if (!session.id) return;
            const response = await attendanceAPI.updateSession(session.id, {
                isActive: !session.isActive
            });
            if (response.data?.success) {
                fetchSessions();
            }
        } catch (error) {
            console.error('Error toggling session status:', error);
        }
    };

    if (loading) return <Skeleton className="h-40 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                        <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                    </span>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                        Attendance Sessions ({sessions.length})
                    </h3>
                </div>
                {!isAdding && (
                    <Button onClick={() => {
                        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                        setFormData({...formData, code: newCode});
                        setIsAdding(true);
                    }} size="sm" className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Session
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[var(--color-surface)]/50 p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Session Name</label>
                            <Input
                                placeholder="Day 1 / Morning Session"
                                value={formData.sessionName}
                                onChange={e => setFormData({ ...formData, sessionName: e.target.value })}
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Location</label>
                            <Input
                                placeholder="Auditorium"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Credits</label>
                            <Input
                                type="number"
                                value={formData.credits}
                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Attendance Code (Auto-generated)</label>
                            <Input
                                value={formData.code}
                                readOnly
                                disabled
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] text-sm font-mono font-bold text-foreground opacity-75 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Start Time <span className="text-red-500">*</span></label>
                            <Input
                                type="datetime-local"
                                value={formData.startTime}
                                min={eventStartDate ? `${toDateOnly(eventStartDate)}T00:00` : undefined}
                                max={eventEndDate ? `${toDateOnly(eventEndDate)}T23:59` : undefined}
                                onChange={e => { setFormData({ ...formData, startTime: e.target.value }); setDateError(null); }}
                                required
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold text-foreground outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">End Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.endTime}
                                min={eventStartDate ? `${toDateOnly(eventStartDate)}T00:00` : undefined}
                                max={eventEndDate ? `${toDateOnly(eventEndDate)}T23:59` : undefined}
                                onChange={e => { setFormData({ ...formData, endTime: e.target.value }); setDateError(null); }}
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold text-foreground outline-none"
                            />
                        </div>
                    </div>

                    {eventStartDate && eventEndDate && (
                        <p className="text-xs text-muted-foreground font-medium pl-1">
                            Allowed date range: {toDateOnly(eventStartDate)} to {toDateOnly(eventEndDate)}
                        </p>
                    )}

                    {dateError && (
                        <p className="text-sm text-red-500 font-semibold pl-1">{dateError}</p>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-lg text-sm font-semibold hover:bg-[var(--color-surface-hover)]">Cancel</Button>
                        <Button size="sm" onClick={handleAddSession} disabled={submitting || !formData.sessionName || !formData.startTime} className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] rounded-lg text-sm font-semibold">
                            {submitting ? 'Creating...' : 'Create Session'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                            No attendance sessions created yet.
                        </p>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="p-5 bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl hover:border-primary/30 hover:bg-[var(--color-surface-hover)]/40 transition-[background-color,border-color,box-shadow] shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg inline-block truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]" title={session.sessionName}>{session.sessionName}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${session.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]'
                                                }`}>
                                                {session.isActive ? 'Open' : 'Closed'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                {session.location}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Key className="w-3 h-3" />
                                                <span className="font-mono font-bold text-foreground">{session.code}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {session.credits} credits
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant={session.isActive ? "destructive" : "default"}
                                        size="sm"
                                        onClick={() => handleToggleActive(session)}
                                        className="shrink-0"
                                    >
                                        {session.isActive ? (
                                            <><XCircle className="w-4 h-4 mr-1" /> Close</>
                                        ) : (
                                            <><CheckCircle className="w-4 h-4 mr-1" /> Open</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
