"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Clock, MapPin, Award, Calendar } from 'lucide-react';
import { attendanceAPI, eventAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

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
  const [eventStartDate, setEventStartDate] = useState<string>(''); // ISO string
  const [eventEndDate, setEventEndDate] = useState<string>('');   // ISO string
  const [eventStatus, setEventStatus] = useState<string>('');
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
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update session.');
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
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 self-start px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                Session Management
              </h1>
              <p className="text-muted-foreground mt-1 text-base font-medium">
                {eventTitle || 'Manage attendance sessions'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center mt-3 md:mt-0">
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="px-6 py-6 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
              disabled={eventStatus === 'COMPLETED'}
            >
              <Plus className="w-5 h-5 stroke-[2.5px]" />
              Create Session
            </Button>
          </div>
        </div>

        {eventStatus === 'COMPLETED' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/20 p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 shadow-sm">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">
              This event is <span className="font-semibold text-amber-900 dark:text-amber-200">Completed</span>. New sessions cannot be created.
            </p>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              Active Sessions
              {!loading && sessions.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {sessions.length}
                </span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-[2rem] border border-dashed border-border/50">
              <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-sm">
                <Clock className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-xl font-bold text-foreground">No sessions yet</p>
              <p className="max-w-xs text-center mt-2 font-medium">
                Create attendance sessions to track student participation for this event.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
                className="mt-8 rounded-xl"
                disabled={eventStatus === 'COMPLETED'}
              >
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="group relative bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                        {session.sessionName}
                      </h3>
                      <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${session.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'}`}>
                        {session.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-90"
                        title="Edit session"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(session)}
                        className={`p-2.5 rounded-xl transition-all active:scale-90 ${session.isActive
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                          }`}
                        title={session.isActive ? 'Deactivate session' : 'Activate session'}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground p-3 rounded-xl bg-muted/30">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      <span className="truncate">{session.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground p-3 rounded-xl bg-muted/30">
                      <Award className="w-4 h-4 text-amber-500/70" />
                      <span>{session.credits} Credits</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground p-3 rounded-xl bg-muted/30 sm:col-span-2">
                      <Calendar className="w-4 h-4 text-primary/60" />
                      <span>{formatDateTime(session.startTime)}</span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 p-4">
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider mb-1">Attendance Code</p>
                        <p className="font-mono font-bold text-2xl tracking-widest text-primary drop-shadow-sm">{session.code}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                {editingSession ? <Edit className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
              </div>
              {editingSession ? 'Edit Session' : 'Create New Session'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Session Name</label>
                <Input
                  value={formData.sessionName}
                  onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                  placeholder="e.g., Morning Workshop / Day 1 Intro"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Auditorium"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Credits</label>
                <Input
                  type="number"
                  value={formData.credits === 0 ? '' : formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 2.0"
                  min="0"
                  step="0.5"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Attendance Code</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Enter or generate code"
                    className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20 font-mono text-lg tracking-widest"
                  />
                  <Button
                    type="button"
                    onClick={generateCode}
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-dashed hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  min={eventStartDate}
                  max={eventEndDate}
                  onChange={(e) => { setFormError(''); setFormData({ ...formData, startTime: e.target.value }); }}
                  className="h-12 rounded-xl bg-muted/30 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">End Time (Optional)</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  min={formData.startTime || eventStartDate}
                  max={eventEndDate}
                  onChange={(e) => { setFormError(''); setFormData({ ...formData, endTime: e.target.value }); }}
                  className="h-12 rounded-xl bg-muted/30 border-border/50"
                />
              </div>
            </div>

            {/* Date range hint */}
            {eventStartDate && eventEndDate && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Event Time Window
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1 font-medium">
                  Sessions must start between {eventStartDate.replace('T', ' ')} and {eventEndDate.replace('T', ' ')}
                </p>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100 animate-in fade-in slide-in-from-top-1">
                {formError}
              </div>
            )}

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50">
              <div className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-lg accent-primary border-muted-foreground/30"
                />
              </div>
              <label htmlFor="isActive" className="text-sm font-semibold text-foreground cursor-pointer">
                Allow student check-ins for this session
              </label>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              className="rounded-xl px-8 h-12"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="rounded-xl px-8 h-12 shadow-md hover:shadow-lg transition-all active:scale-95">
              {editingSession ? 'Save Changes' : 'Initialize Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


