'use client';

import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Loader2,
  Users,
  FileText,
  Image as ImageIcon,
  Clock,
  Settings,
  CheckCircle,
  Calendar,
  Sun,
  Moon,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { apiUrl } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendeeList } from "@/components/admin/AttendeeList";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { SessionManager } from "@/components/admin/SessionManager";

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  credits: number;
  capacity: number;
  prerequisite: string;
}

const EditEventPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    credits: 0,
    capacity: 0,
    prerequisite: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Prevent duplicate fetches
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchEventData = async () => {
      // Prevent duplicate API calls
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        setIsLoading(true);
        setErrorMessage('');
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiUrl}/events/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const eventData = response.data.data;

        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';

          // Use local methods since the stored date string is already ISO converted from local
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        };

        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          startDate: formatDateForInput(eventData.startDate),
          endDate: formatDateForInput(eventData.endDate),
          location: eventData.location || '',
          credits: eventData.credits || 0,
          capacity: eventData.capacity || 0,
          prerequisite: eventData.prerequisite || '',
        });
      } catch (err: any) {
        console.error('Error fetching event data:', err);

        if (err.response?.status === 429) {
          setErrorMessage('Too many requests. Please wait a moment and refresh the page.');
        } else if (err.response?.status === 404) {
          setErrorMessage('Event not found.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setErrorMessage('You do not have permission to edit this event.');
        } else {
          setErrorMessage('Failed to load event data. Please try again.');
        }

        setSubmitStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) fetchEventData();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const calculateNumDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    const { title, description, startDate, endDate, location, credits, capacity } = formData;
    if (!title.trim() || !description.trim() || !startDate || !endDate || !location.trim() || credits <= 0 || capacity <= 0) {
      setSubmitStatus('error');
      alert('Please fill in all the fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const numDays = calculateNumDays(startDate, endDate);

      // Create local date objects at the exact start (00:00:00) and end (23:59:59) of the day
      const startDateObj = new Date(startDate + 'T00:00:00');
      const endDateObj = new Date(endDate + 'T23:59:59');

      const payload = {
        ...formData,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        numDays
      };

      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${apiUrl}/events/${eventId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log("✅ Event updated:", response.data);
      setSubmitStatus('success');
      setTimeout(() => router.push('/admin/dashboard'), 1500);
    } catch (err: any) {
      console.error('❌ Error updating event:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 bg-[var(--color-surface)] text-[var(--color-text-primary)]`}>
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-lg p-6 shadow bg-[var(--color-card)]`}>
            {errorMessage ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                <p className="text-lg font-semibold mb-2">Error Loading Event</p>
                <p className="text-sm text-[var(--color-text-muted)]">{errorMessage}</p>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="mt-4 bg-[var(--color-button-primary)] text-white px-6 py-2 rounded hover:bg-[var(--color-button-primary)]"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                <span className="ml-2">Loading event data...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--color-card)] p-8 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-2 self-start px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                Edit Event Configuration
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Refine the details and manage student engagement for this event.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 leading-tight">Organizer</span>
                <span className="text-xs font-semibold text-primary">ACM Student Chapter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Configuration Form */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-8 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

              <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 relative z-10">
                <FileText className="w-6 h-6 text-primary" />
                Core Information
                <span className="ml-auto px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/20">
                  Live Sync Active
                </span>
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Title</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a compelling title..."
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-lg font-semibold placeholder:font-medium"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Description & Context</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write a detailed description of what students can expect..."
                    className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium leading-relaxed"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Timeline Start</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                        required
                      />
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Timeline End</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                        required
                      />
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Venue / Digital Link</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Physical room or meeting URL"
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Credit Reward</label>
                    <input
                      type="number"
                      name="credits"
                      value={formData.credits}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Student Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Required Prerequisites</label>
                  <textarea
                    name="prerequisite"
                    value={formData.prerequisite}
                    onChange={handleInputChange}
                    placeholder="List any software, knowledge, or tools required..."
                    className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium"
                    rows={3}
                  />
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Computed Schedule: <span className="font-bold underline underline-offset-4">{calculateNumDays(formData.startDate, formData.endDate)} session days</span> planned.
                    </p>
                  </div>
                )}

                {submitAttempted && submitStatus === 'error' && (
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 animate-in shake-in-1">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">Unable to sync changes. Please verify connection and try again.</p>
                  </div>
                )}

                {submitStatus === 'success' && (
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">All modifications successfully pushed to registry.</p>
                  </div>
                )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[var(--color-border)]/50">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] h-14 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-lg shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
              {isSubmitting ? 'Pushing Updates...' : 'Publish Modifications'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-10 h-14 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all active:scale-95 bg-transparent"
            >
              Discard Changes
            </button>
          </div>
        </form>
      </div>

      {/* Attendance Section */}
      <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-8 sm:p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 bg-[var(--color-primary)] h-full opacity-50 group-hover:opacity-100 transition-opacity" />
        <SessionManager eventId={Number(eventId)} eventStartDate={formData.startDate} eventEndDate={formData.endDate} />
      </div>
          </div>

          {/* Management Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Tabs defaultValue="attendees" className="w-full">
              <div className="bg-[var(--color-card)] p-3 rounded-[2rem] border border-[var(--color-border)] shadow-sm mb-6">
                <TabsList className="grid w-full grid-cols-3 bg-muted/30 rounded-2xl p-1 gap-1 h-auto">
                  <TabsTrigger value="attendees" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                    <Users className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                    <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">RSVPs</span>
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                    <FileText className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                    <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">Files</span>
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                    <ImageIcon className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                    <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">Gallery</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-2 shadow-sm min-h-[600px] overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar p-6">
                  <TabsContent value="attendees" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-2 mb-6 px-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Registration Hub</h3>
                    </div>
                    <AttendeeList eventId={Number(eventId)} />
                  </TabsContent>

                  <TabsContent value="resources" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-2 mb-6 px-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Asset Repository</h3>
                    </div>
                    <ResourceManager eventId={Number(eventId)} />
                  </TabsContent>

                  <TabsContent value="gallery" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-2 mb-6 px-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Visual Archive</h3>
                    </div>
                    <GalleryManager eventId={Number(eventId)} />
                  </TabsContent>
                </div>
              </div>
            </Tabs>

            {/* Action Quick Links */}
            <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-8 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Advanced Controls</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => router.push(`/admin/events/${eventId}/analytics`)}
                  className="w-full p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/20 hover:text-[var(--color-primary)] transition-all flex items-center justify-between group"
                >
                  <span className="font-bold">Real-time Analytics</span>
                  <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  className="w-full p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-between group"
                  onClick={() => alert("Permanent deletion requires higher clearance.")}
                >
                  <span className="font-bold">Archive This Event</span>
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;
