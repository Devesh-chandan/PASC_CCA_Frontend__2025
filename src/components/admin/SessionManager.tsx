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
}

export function SessionManager({ eventId }: SessionManagerProps) {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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

    const generateCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData({ ...formData, code });
    };

    const handleAddSession = async () => {
        if (!formData.sessionName || !formData.code) return;
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
                fetchSessions();
            }
        } catch (error) {
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Attendance Sessions
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Session
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Session Name</label>
                            <Input
                                placeholder="Day 1 / Morning Session"
                                value={formData.sessionName}
                                onChange={e => setFormData({ ...formData, sessionName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Location</label>
                            <Input
                                placeholder="Auditorium"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Credits</label>
                            <Input
                                type="number"
                                value={formData.credits}
                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-medium">Attendance Code</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="CODE123"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="font-mono bg-accent"
                                />
                                <Button variant="outline" size="icon" onClick={generateCode}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Start Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">End Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAddSession} disabled={submitting || !formData.code || !formData.sessionName}>
                            {submitting ? 'Creating...' : 'Create Session'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                        No attendance sessions created yet.
                    </p>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{session.sessionName}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${session.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
    );
}
