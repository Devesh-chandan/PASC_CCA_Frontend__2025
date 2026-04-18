'use client';
import { useRouter } from "next/navigation";
import axios from "axios";
import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  MapPin,
  Users,
  Award,
  Clock,
  FileText,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { apiUrl } from "@/lib/utils";
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

const Page: React.FC = () => {
  const router = useRouter();
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
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      // Handle number inputs - use parseInt for capacity (must be integer), parseFloat for credits
      if (name === 'capacity') {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(numValue) ? 0 : numValue
        }));
      } else {
        const numValue = value === '' ? 0 : parseFloat(value);
        setFormData(prev => ({
          ...prev,
          [name]: isNaN(numValue) ? 0 : numValue
        }));
      }
    } else {
      // Handle text inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateNumDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleSubmit = async () => {
    // Check for any missing fields
    const { title, description, startDate, endDate, location, credits, capacity } = formData;
    if (
      !title.trim() ||
      !description.trim() ||
      !startDate ||
      !endDate ||
      !location.trim() ||
      credits <= 0 ||
      capacity <= 0
    ) {
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

      console.log("📦 Payload being sent to backend:", payload);
      const res = await axios.post(`${apiUrl}/events`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      console.log("✅ Event created successfully:", res.data);

      setSubmitStatus('success');

      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        credits: 0,
        capacity: 0,
        prerequisite: '',
      });

      // Redirect after success with delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Error creating event:', err);
      console.error('Error response:', err.response?.data);
      setSubmitStatus('error');

      // Show detailed validation errors if available
      if (err.response?.data?.details) {
        const validationErrors = err.response.data.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join('\n');
        alert(`Validation failed:\n\n${validationErrors}`);
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create event. Please try again.';
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center gap-4 bg-[var(--color-card)] p-8 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm">
          <div className="flex-1 flex flex-col gap-2">
            <button
              className="flex items-center gap-2 self-start px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <p className="text-3xl font-bold text-foreground">
                Create New Event
              </p>
              <p className="text-muted-foreground mt-1 font-medium">
                Set up a new event for students to RSVP and engage.
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

        {/* Main Form Card */}
        <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-8 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 relative z-10">
            <FileText className="w-6 h-6 text-primary" />
            Core Configuration
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8 relative z-10">
            
            {/* Event Title */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter an engaging and memorable event title..."
                className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-lg font-semibold placeholder:font-medium"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what makes this event special and why people should attend..."
                rows={5}
                className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium leading-relaxed resize-y"
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                    required
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                    required
                  />
                  <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Where will this amazing event take place?"
                className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                required
              />
            </div>

            {/* Credits and Capacity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Academic Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits === 0 ? '' : formData.credits}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.5"
                  min="0"
                  step="0.5"
                  className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Event Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity === 0 ? '' : formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  min="1"
                  className="w-full h-14 px-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold"
                  required
                />
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Prerequisites (Optional)</label>
              <textarea
                name="prerequisite"
                value={formData.prerequisite}
                onChange={handleInputChange}
                placeholder="Any requirements, skills, or knowledge needed for attendees..."
                rows={3}
                className="w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all text-base font-medium resize-y"
              />
            </div>

            {/* Duration Display */}
            {formData.startDate && formData.endDate && (
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                <Clock className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Computed Schedule: <span className="font-bold underline underline-offset-4">{calculateNumDays(formData.startDate, formData.endDate)} session days</span> planned.
                </p>
              </div>
            )}

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">Event created successfully! 🎉 Redirecting to dashboard...</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 animate-in shake-in-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">Failed to create event. Please check all fields and try again.</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-[var(--color-border)]/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] h-14 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-lg shadow-sm"
              >
                {isSubmitting ? <Plus className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                {isSubmitting ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;