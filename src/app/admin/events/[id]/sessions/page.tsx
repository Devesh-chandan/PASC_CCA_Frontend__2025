"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Clock, MapPin, Award, Calendar, AlertCircle } from 'lucide-react';
import { attendanceAPI, eventAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface AttendanceSession {
  id: number;
  eventId: number;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  sessionName: string;
  code: string;
  location: string;
  credits: number;
}

export default function SessionManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number>(0);
  const [eventTitle, setEventTitle] = useState<string>('');
  const { success, error, info } = useToast();
  const [eventStartDate, setEventStartDate] = useState<string>(''); // ISO string
  const [eventEndDate, setEventEndDate] = useState<string>('');   // ISO string
  const [eventStatus, setEventStatus] = useState<string>('');
  const [isEventDeleted, setIsEventDeleted] = useState(false);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    sessionName: '',
    location: '',
    // code: '',
    credits: 0,
    startTime: '',
    endTime: '',
    isActive: true,
  });

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const numId = parseInt(id);
      setEventId(numId);

      // Fetch event details
      try {
        const eventResponse = await eventAPI.getById(numId);
        if (eventResponse.data?.success && eventResponse.data.data) {
          const event = eventResponse.data.data as any;
          setEventTitle(event.title);
          // Store event date boundaries (convert to local datetime-local format)
          const toLocalInput = (iso: string) => {
            const d = new Date(iso);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
          };
          setEventStartDate(toLocalInput(event.startDate));
          setEventEndDate(toLocalInput(event.endDate));
          setEventStatus(event.status ?? '');
          setIsEventDeleted(event.isDeleted ?? false);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }

      fetchSessions(numId);
    };
    init();
  }, [params]);

  const fetchSessions = async (id: number) => {
    try {
      const response = await attendanceAPI.getEventSessions(id);
      if (response.data?.success && response.data.data) {
        setSessions(response.data.data as any);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formData.startTime) {
      setFormError('Please select a start time');
      return;
    }

    // Client-side date range validation
    if (eventStartDate && eventEndDate) {
      const eventStart = new Date(eventStartDate);
      const eventEnd = new Date(eventEndDate);
      const sessionStart = new Date(formData.startTime);

      if (sessionStart < eventStart || sessionStart > eventEnd) {
        setFormError(
          `Session start time must be within the event range: ${eventStartDate.replace('T', ' ')} – ${eventEndDate.replace('T', ' ')}`
        );
        return;
      }

      if (formData.endTime) {
        const sessionEnd = new Date(formData.endTime);
        if (sessionEnd < eventStart || sessionEnd > eventEnd) {
          setFormError(
            `Session end time must be within the event range: ${eventStartDate.replace('T', ' ')} – ${eventEndDate.replace('T', ' ')}`
          );
          return;
        }
        if (sessionEnd <= sessionStart) {
          setFormError('Session end time must be after the session start time.');
          return;
        }
      }
    }

    try {
      const payload = {
        sessionName: formData.sessionName,
        location: formData.location,
        // code: formData.code,
        credits: formData.credits,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        isActive: formData.isActive,
      };

      if (editingSession) {
        await attendanceAPI.updateSession(editingSession.id, payload);
      } else {
        await attendanceAPI.createSession(eventId, payload);
      }
      setShowDialog(false);
      resetForm();
      fetchSessions(eventId);
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to save session. Please try again.';
      setFormError(msg);
    }
  };

  // Note: Backend doesn't have a delete session endpoint
  // Sessions can be deactivated by setting isActive to false
  const handleDeactivate = async (session: AttendanceSession) => {
    if (!confirm(`Are you sure you want to ${session.isActive ? 'deactivate' : 'activate'} this session?`)) return;

    try {
      await attendanceAPI.updateSession(session.id, { isActive: !session.isActive });
      fetchSessions(eventId);
      info(
        !session.isActive ? 'Session Activated' : 'Session Deactivated',
        !session.isActive ? 'Students can now mark attendance.' : 'Attendance recording has been stopped.'
      );
    } catch (sessionErr) {
      console.error('Error updating session:', sessionErr);
      error('Update Failed', 'Failed to update session. Please try again.');
    }
  };

  const handleEdit = (session: AttendanceSession) => {
    setEditingSession(session);

    const toLocalDatetime = (isoString: string | null) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    setFormData({
      sessionName: session.sessionName,
      location: session.location,
      // code: session.code,
      credits: session.credits,
      startTime: toLocalDatetime(session.startTime),
      endTime: toLocalDatetime(session.endTime),
      isActive: session.isActive,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingSession(null);
    setFormError('');
    setFormData({
      sessionName: '',
      location: '',
      // code: '',
      credits: 0,
      startTime: '',
      endTime: '',
      isActive: true,
    });
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // setFormData({ ...formData, code });
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/admin/events')}
              className="flex items-center gap-2 self-start px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Back to Events</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Session Management</h1>
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-1">{eventTitle}</p>
                </div>
              </div>
              {!isEventDeleted && (
                <Button
                  onClick={() => {
                    resetForm();
                    setShowDialog(true);
                  }}
                  className="flex items-center gap-2"
                  disabled={eventStatus === 'COMPLETED'}
                  title={eventStatus === 'COMPLETED' ? 'Cannot create sessions for a completed event' : undefined}
                >
                  <Plus className="w-5 h-5" />
                  Create Session
                </Button>
              )}
            </div>
          </div>
        </header>

        {!isEventDeleted && eventStatus === 'COMPLETED' && (
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all duration-300">
            {/* Soft decorative glow background */}
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-[var(--color-text-secondary)]/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-[var(--color-text-secondary)] stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-[var(--color-text-primary)] leading-tight tracking-tight">
                  Event Completed
                </h4>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
                  This event is completed. New sessions cannot be created.
                </p>
              </div>
            </div>
          </div>
        )}

        {isEventDeleted && (
          <div className="relative overflow-hidden rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10 p-5 shadow-sm transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-red-700 dark:text-red-400 leading-tight tracking-tight">
                  Deleted Event
                </h4>
                <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80 leading-relaxed">
                  This event has been deleted. You can only view its past sessions.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Sessions List */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] p-6 shadow-sm">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2 font-bold">No sessions yet</p>
              <p className="text-sm">
                {isEventDeleted 
                  ? "No historical sessions exist for this event." 
                  : "Create attendance sessions for this event."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="p-5 bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl hover:border-primary/30 hover:bg-[var(--color-surface-hover)]/40 transition-[background-color,border-color,box-shadow] shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
                        {session.sessionName}
                      </h3>
                      <Badge variant={session.isActive ? "default" : "secondary"} className="mt-1">
                        {session.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {!isEventDeleted && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                          title="Edit session"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(session)}
                          className={`p-2 rounded-lg transition-colors ${session.isActive
                            ? 'hover:bg-red-100 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-100 dark:hover:bg-green-900/20'
                            }`}
                          title={session.isActive ? 'Deactivate session' : 'Activate session'}
                        >
                          <Clock className={`w-4 h-4 ${session.isActive ? 'text-red-600' : 'text-green-600'}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateTime(session.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <Award className="w-4 h-4" />
                      <span>{session.credits} credits</span>
                    </div>
                    <div className="mt-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Attendance Code</p>
                        <p className="font-mono font-extrabold text-xl text-[var(--color-primary)] tracking-wider mt-0.5">{session.code}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit Session' : 'Create Session'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Name</label>
              <Input
                value={formData.sessionName}
                onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                placeholder="e.g., Day 1 - Morning Session"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Auditorium A"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium mb-2">Attendance Code</label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., ABC123"
                  className="flex-1"
                />
                <Button type="button" onClick={generateCode} variant="outline">
                  Generate
                </Button>
              </div>
            </div> */}

            <div>
              <label className="block text-sm font-medium mb-2">Credits</label>
              <Input
                type="number"
                value={formData.credits === 0 ? '' : formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 1"
                min="0"
                step="0.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  min={eventStartDate}
                  max={eventEndDate}
                  onChange={(e) => { setFormError(''); setFormData({ ...formData, startTime: e.target.value }); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time (Optional)</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  min={formData.startTime || eventStartDate}
                  max={eventEndDate}
                  onChange={(e) => { setFormError(''); setFormData({ ...formData, endTime: e.target.value }); }}
                />
              </div>
            </div>

            {/* Date range hint */}
            {eventStartDate && eventEndDate && (
              <p className="text-xs text-muted-foreground">
                Session times must be within event range:{' '}
                <span className="font-medium">{eventStartDate.replace('T', ' ')}</span>
                {' '}–{' '}
                <span className="font-medium">{eventEndDate.replace('T', ' ')}</span>
              </p>
            )}

            {/* Validation error */}
            {formError && (
              <p className="text-sm text-red-500 font-medium">{formError}</p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm">
                Session is active (students can mark attendance)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSession ? 'Update' : 'Create'} Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

