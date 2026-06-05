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
import { useToast } from "@/components/ui/toast";

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { success, error: toastError, warning } = useToast();

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

        // setSubmitStatus('error');
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
      warning('Incomplete Form', 'Please fill in all the fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    // setSubmitStatus(null);

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
      success('Changes Saved!', 'Event details have been updated successfully. Redirecting...');
      setTimeout(() => router.push('/admin/events'), 1500);
    } catch (err: any) {
      console.error('❌ Error updating event:', err);
      toastError('Update Failed', 'Unable to sync changes. Please verify your connection and try again.');
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
                  onClick={() => router.push('/admin/events')}
                  className="mt-4 bg-[var(--color-button-primary)] text-white px-6 py-2 rounded hover:bg-[var(--color-button-primary)]"
                >
                  Back to Events
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
    <main className="min-h-screen bg-[var(--color-background)] p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--color-card)] p-5 sm:p-7 rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/admin/events')}
              className="flex items-center gap-2 self-start px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Back to Events</span>
            </button>
            <div className="flex items-start gap-4 sm:gap-5 mt-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
                  Edit Event Configuration
                </h1>
                <p className="text-[13px] sm:text-sm text-[var(--color-text-muted)] font-medium mt-1 leading-relaxed max-w-2xl">
                  Refine the details and manage student engagement for this event.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 leading-tight">Organizer</span>
                <span className="text-xs font-semibold text-primary">ACM Student Chapter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:space-y-10">
          {/* Main Configuration Form */}
          <div className="bg-[var(--color-card)] rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="flex items-center gap-2.5 mb-6 relative z-10">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                <FileText className="w-5 h-5 text-[var(--color-primary)]" />
              </span>
              <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-foreground">
                Core Information
              </h3>
              <span className="ml-auto px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                Live Sync Active
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-6 relative z-10"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a compelling title..."
                  className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-semibold placeholder:font-medium text-foreground outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Description & Context</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write a detailed description of what students can expect..."
                  className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium leading-relaxed text-foreground resize-y outline-none"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Timeline Start</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-foreground text-sm outline-none"
                      required
                    />
                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Timeline End</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-foreground text-sm outline-none"
                      required
                    />
                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Venue / Digital Link</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Physical room or meeting URL"
                  className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-foreground text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Credit Reward</label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-foreground text-sm outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Student Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-foreground text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Required Prerequisites</label>
                <textarea
                  name="prerequisite"
                  value={formData.prerequisite}
                  onChange={handleInputChange}
                  placeholder="List any software, knowledge, or tools required..."
                  className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium text-foreground resize-y outline-none"
                  rows={3}
                />
              </div>

              {formData.startDate && formData.endDate && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--color-info)]/5 dark:bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 text-[var(--color-info)]">
                  <Clock className="w-5 h-5 text-[var(--color-info)]" />
                  <p className="text-[13px] font-semibold">
                    Computed Schedule: <span className="font-bold underline underline-offset-4">{calculateNumDays(formData.startDate, formData.endDate)} session days</span> planned.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[var(--color-border-light)]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] h-14 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-base shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {isSubmitting ? 'Pushing Updates...' : 'Publish Modifications'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/events')}
                  className="px-10 h-14 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all active:scale-95 bg-transparent"
                >
                  Discard Changes
                </button>
              </div>
            </form>
          </div>

          {/* Registration Details Section */}
          <div className="bg-[var(--color-card)] rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <AttendeeList eventId={Number(eventId)} />
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="sessions" className="w-full">
            <div className="bg-[var(--color-card)] p-2.5 rounded-2xl border border-[var(--color-border)] shadow-sm mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 rounded-xl p-1 gap-1 h-auto">
                <TabsTrigger value="sessions" className="rounded-lg py-2.5 flex flex-col md:flex-row items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] data-[state=active]:!bg-[var(--color-button-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm transition-all duration-200">
                  <Clock className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">Sessions</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="rounded-lg py-2.5 flex flex-col md:flex-row items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] data-[state=active]:!bg-[var(--color-button-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm transition-all duration-200">
                  <FileText className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">Files</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="rounded-lg py-2.5 flex flex-col md:flex-row items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] data-[state=active]:!bg-[var(--color-button-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm transition-all duration-200">
                  <ImageIcon className="w-4 h-4 mb-1 md:mb-0 md:mr-2" />
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-tight">Gallery</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-[var(--color-card)] rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm">
              <TabsContent value="sessions" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                <SessionManager eventId={Number(eventId)} eventStartDate={formData.startDate} eventEndDate={formData.endDate} />
              </TabsContent>

              <TabsContent value="resources" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                <ResourceManager eventId={Number(eventId)} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                <GalleryManager eventId={Number(eventId)} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default EditEventPage;
