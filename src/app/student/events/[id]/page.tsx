'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Phone, ArrowLeft, FileText, Video, Link as LinkIcon, Code, File, CheckCircle, QrCode } from "lucide-react";
import { getStatusBadgeVariant, getStatusColor, formatDate } from "@/lib/utils";
import { attendanceAPI, resourceAPI } from "@/lib/api";
import { EventAttendanceSessionForUser, AttendanceSessionForUser } from "@/types/attendance";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ReviewSection } from "@/components/events/ReviewSection";
import { GallerySection } from "@/components/events/GallerySection";
import { useToast } from "@/components/ui/toast";

function formatDateToDDMMYY(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<EventAttendanceSessionForUser | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceModal, setAttendanceModal] = useState<{ open: boolean; sessionId: number | null }>({ open: false, sessionId: null });
  const [attendanceCode, setAttendanceCode] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);
  const { success: toastSuccess } = useToast();

  useEffect(() => {
    const resolveParamsAndFetch = async () => {
      try {
        setLoading(true);
        const { id } = await params;
        console.log(id);
        const token = localStorage.getItem("token");
        console.log("getting the event.")
        const res = await attendanceAPI.getUserSessionsByEvent(Number(id));
        setEvent(res.data.data);

        // Fetch resources
        try {
          const resourceRes = await resourceAPI.getEventResources(Number(id));
          if (resourceRes.data.success) {
            setResources(resourceRes.data.data);
          }
        } catch (resourceErr) {
          console.error("Failed to fetch resources:", resourceErr);
        }
      } catch (err) {
        setError("Failed to fetch event");
        setEvent(null);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    resolveParamsAndFetch();
  }, [params]);

  // Handler for mark attendance
  const handleMarkAttendance = async () => {
    if (!attendanceCode || !attendanceModal.sessionId || !event) return;
    const sessionIdNum = Number(attendanceModal.sessionId);
    const eventIdNum = Number(event.event?.id);
    setAttendanceLoading(true);
    setAttendanceError(null);
    setAttendanceSuccess(null);
    try {
      const res = await attendanceAPI.markAttendance(
        eventIdNum,
        sessionIdNum,
        attendanceCode
      );
      if (res.data && res.data.success) {
        const sid = sessionIdNum;
        const sessionRow = Array.isArray(event.session)
          ? event.session.find((s: AttendanceSessionForUser) => s.id === sid)
          : undefined;
        const creditsEarned = sessionRow?.credits ?? event.event?.credits ?? 0;
        const eventTitle = event.event?.title ?? "this event";
        const creditWord = creditsEarned === 1 ? "credit" : "credits";

        setEvent((prev) => {
          if (!prev || !Array.isArray(prev.session)) return prev;
          return {
            ...prev,
            session: prev.session.map((s: AttendanceSessionForUser) =>
              s.id === sid ? { ...s, attended: true } : s
            ),
          };
        });

        toastSuccess(
          "Attendance Marked",
          `Your attendance for ${eventTitle} has been marked. You earned ${creditsEarned} ${creditWord}!`
        );

        setAttendanceModal({ open: false, sessionId: null });
        setAttendanceCode("");
        setAttendanceSuccess(null);
      } else {
        setAttendanceError(res.data?.message || "Failed to mark attendance.");
      }
    } catch (err: any) {
      console.error('Attendance error:', err?.response?.data?.message);
      setAttendanceError(err?.response?.data?.message || "Failed to mark attendance.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--color-primary)] mx-auto"></div>
          <p className="text-[var(--color-text-muted)] mt-4">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Event Not Found</h2>
          <p className="text-[var(--color-text-muted)] mt-2">
            {error || "The event you are looking for does not exist."}
          </p>
        </div>
      </div>
    );
  }

  // TODO: Fix typing once API response is finalized
  const eventDetails: any = event.event;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 py-8">
      {/* Navigation Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          className="flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] cursor-pointer transition-colors"
          onClick={() => router.push('/student/events')}
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back to Events</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Title Card */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="w-full overflow-hidden">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <CardTitle className="text-2xl font-bold text-[var(--color-text-primary)] break-words max-w-full">
                  {eventDetails?.title}
                </CardTitle>
                <Badge
                  variant={getStatusBadgeVariant(eventDetails?.status)}
                  className={getStatusColor(eventDetails?.status)}
                >
                  {eventDetails?.status}
                </Badge>
              </div>
              <div className="w-full overflow-hidden pt-4">
                <p className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap break-words w-full">
                  {eventDetails?.description}
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Prerequisites */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--color-text-muted)]">{eventDetails?.prerequisite}</p>
            </CardContent>
          </Card>

          {/* Sessions List (Student View) */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200 bg-[var(--color-card)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(event.session) && event.session.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {event.session.map((session: any) => (
                    <div
                      key={session.id}
                      className="border border-[var(--color-border)] rounded-lg p-5 transition-all bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] shadow-sm hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Title */}
                        <div className="mb-3 flex justify-between items-start">
                          <span className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{session.sessionName}</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${session.isActive ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]'
                              }`}
                          >
                            {session.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        {/* Location */}
                        <div className="mb-2 flex items-center text-sm text-[var(--color-text-muted)]">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                        {/* Start/End Time */}
                        <div className="mb-4 flex items-center text-sm text-[var(--color-text-muted)]">
                          <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>
                            {session.startTime ? new Date(session.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "-"} - {session.endTime ? new Date(session.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "-"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Mark Attendance Button */}
                      {session.isActive && (
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                          {eventDetails?.status === 'COMPLETED' ? (
                            <Button
                              className="w-full bg-[var(--color-text-muted)] text-white font-semibold cursor-not-allowed"
                              disabled
                            >
                              Event Completed
                            </Button>
                          ) : session.attended ? (
                            <Button
                              className="w-full bg-[var(--color-success)] text-white font-semibold flex items-center justify-center gap-2"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4" /> Attendance Marked
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-button-primary-hover)] text-white font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                              onClick={() => setAttendanceModal({ open: true, sessionId: session.id })}
                            >
                              Mark Attendance
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[var(--color-text-muted)] italic">No sessions available for this event.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Start Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                  <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Start Date</p>
                  <p className="text-[var(--color-text-muted)] text-sm">{formatDate(eventDetails?.startDate)}</p>
                </div>
              </div>

              <Separator />

              {/* End Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                  <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">End Date</p>
                  <p className="text-[var(--color-text-muted)] text-sm">{formatDate(eventDetails?.endDate)}</p>
                </div>
              </div>

              <Separator />

              {/* Credit Hours */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                  <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Credit Hours</p>
                  <p className="text-[var(--color-text-muted)] text-sm">{eventDetails?.credits}</p>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                  <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Location</p>
                  <p className="text-[var(--color-text-muted)] text-sm">{eventDetails?.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                  <Phone className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Contact:</p>
                  <p className="text-[var(--color-text-muted)] text-sm">{eventDetails?.contact}</p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Reviews Section */}
          {/* <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewSection eventId={Number(eventDetails?.id)} eventStatus={eventDetails?.status || ''} />
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Two-column layout for Resources/Gallery & Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-8">
        {/* Left Column: Resources and Gallery */}
        <div className="space-y-6 flex flex-col items-stretch">
          {/* Resources List */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Event Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resources.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {resources.map((resource: any) => {
                    const getIcon = (type: string) => {
                      switch (type) {
                        case 'SLIDES': return <FileText className="w-5 h-5 text-orange-500" />;
                        case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
                        case 'CODE': return <Code className="w-5 h-5 text-[var(--color-info)]" />;
                        case 'LINK': return <LinkIcon className="w-5 h-5 text-green-500" />;
                        case 'DOCUMENT': return <FileText className="w-5 h-5 text-[var(--color-primary)]" />;
                        default: return <File className="w-5 h-5 text-[var(--color-text-muted)]" />;
                      }
                    };

                    return (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] shadow-sm flex-shrink-0">
                            {getIcon(resource.type)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-[var(--color-text-primary)] truncate">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-[var(--color-text-muted)] truncate">{resource.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4 flex-shrink-0 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-[var(--color-surface)] rounded-lg border border-dashed border-[var(--color-border)]">
                  <p className="text-[var(--color-text-muted)]">No resources available for this event yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery Section */}
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200 flex-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Event Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GallerySection eventId={Number(eventDetails?.id)} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Reviews */}
        <div className="flex flex-col h-full w-full">
          <Card className="border-none shadow-sm hover:shadow-lg transition-shadow duration-200 h-full w-full flex flex-col items-stretch">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--color-text-primary)]">
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <ReviewSection eventId={Number(eventDetails?.id)} eventStatus={eventDetails?.status || ''} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Code Modal */}
      <Dialog open={attendanceModal.open} onOpenChange={open => setAttendanceModal(v => ({ ...v, open }))}>
        <DialogContent className="bg-[var(--color-card)] border-[var(--color-border)] shadow-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">Enter Attendance Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Enter code"
              value={attendanceCode}
              onChange={e => setAttendanceCode(e.target.value)}
              disabled={attendanceLoading}
              className="w-full bg-[var(--color-surface)] border-[var(--color-input-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-input-focus)] focus:ring-[var(--color-input-focus-ring)]"
            />
            {attendanceError && <div className="text-[var(--color-destructive)] text-sm">{attendanceError}</div>}
            {attendanceSuccess && <div className="text-[var(--color-success)] text-sm">{attendanceSuccess}</div>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setAttendanceModal({ open: false, sessionId: null });
                setAttendanceCode("");
                setAttendanceError(null);
                setAttendanceSuccess(null);
              }}
              disabled={attendanceLoading}
              className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={attendanceLoading || !attendanceCode}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-button-primary-hover)] text-white"
            >
              {attendanceLoading ? "Marking..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


