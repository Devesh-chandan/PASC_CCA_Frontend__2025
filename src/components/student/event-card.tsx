import { Event, EventWithRsvp, Rsvp } from '@/types/events';
import { Calendar, MapPin, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { rsvpAPI } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

/* ──── Status badge colours ──── */
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING: {
    bg: 'bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20',
    text: 'text-[var(--color-primary)] font-bold',
    dot: 'bg-[var(--color-primary)]',
  },
  ONGOING: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400 font-bold',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  COMPLETED: {
    bg: 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-hover)]/60',
    text: 'text-[var(--color-text-muted)] font-bold',
    dot: 'bg-[var(--color-text-muted)]',
  },
};

const sessionsChipClass =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-border-light)] shadow-sm font-semibold bg-primary/10 dark:bg-primary/15 text-primary';

export const EventCard = ({
  eventWithRsvp,
  onRsvpChange,
}: {
  eventWithRsvp: EventWithRsvp;
  onRsvpChange: (eventId: number, rsvp: Rsvp | null) => void;
}) => {
  const event = eventWithRsvp.event;
  const status = statusConfig[event.status] ?? statusConfig.UPCOMING;
  const statusLabel = event.status;
  const { success, error } = useToast();
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const eventExtras = event as Event & {
    _count?: { session?: number; sessions?: number };
    session?: unknown[];
  };
  const sessionTotal =
    event.sessionCount ??
    eventExtras._count?.session ??
    eventExtras._count?.sessions ??
    (Array.isArray(eventExtras.session) ? eventExtras.session.length : 0);

  const formatDateInIST = (value: string | Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  async function handleRsvpButton() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        error('Authentication Required', 'Please log in to RSVP for events.');
        return;
      }
      setRsvpLoading(true);
      const createRes = await rsvpAPI.create(event.id);
      const rsvpRes = await rsvpAPI.getRsvpByEventId(event.id);
      const newRsvp = rsvpRes.data?.data as Rsvp | undefined;
      if (newRsvp) {
        onRsvpChange(event.id, newRsvp);
      }
      const waitlisted = createRes.data?.data?.status === 'WAITLISTED';
      if (waitlisted) {
        success('Added to waitlist', `You're on the waitlist for "${event.title}".`);
      } else {
        success('RSVP Confirmed!', `You are now registered for "${event.title}".`);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.response?.data?.message || 'Failed to RSVP. Please try again.';
      error('RSVP Failed', errorMessage);
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleRsvpCancel() {
    try {
      if (!eventWithRsvp.rsvp?.id) {
        error('Cancellation Failed', 'No RSVP found to cancel.');
        return;
      }
      setRsvpLoading(true);
      await rsvpAPI.cancel(eventWithRsvp.rsvp.id);
      onRsvpChange(event.id, null);
      success('RSVP Cancelled', `Your registration for "${event.title}" has been cancelled.`);
    } catch (err: any) {
      error('Cancellation Failed', err.response?.data?.error || 'Failed to cancel RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  }

  return (
    <div className="group flex flex-col h-full bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border-light)] hover:shadow-md hover:border-[var(--color-border)] transition-all duration-300 overflow-hidden relative">
      
      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col">
        
        {/* Title */}
        <h3 className="text-[19px] sm:text-[20px] font-bold text-[var(--color-text-primary)] leading-[1.3] line-clamp-2 min-h-[52px] mb-3">
          {event.title}
        </h3>

        {/* Status + session count (same chip family as status) */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-border-light)] shadow-sm font-semibold ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`}></span>
            {statusLabel}
          </span>
          {sessionTotal > 0 && (
            <span className={sessionsChipClass}>
              <Calendar className="w-3.5 h-3.5 shrink-0 opacity-90" />
              {sessionTotal} Session{sessionTotal !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Metadata Stack - Pill/Badge Layout */}
        <div className="flex flex-col gap-2.5 mb-6">
          
          <div className="flex items-center gap-2.5 bg-black/[0.015] dark:bg-white/[0.04] shadow-sm dark:shadow-black/20 border border-[var(--color-border-light)] px-3.5 py-2 rounded-xl text-[13px] hover:border-[var(--color-border)] transition-colors w-full">
            <Calendar className="w-[16px] h-[16px] text-[var(--color-text-muted)] shrink-0" />
            <span className="font-medium text-[var(--color-text-primary)] tracking-wide truncate">
              {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} <span className="text-[var(--color-text-muted)] mx-0.5">-</span> {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-black/[0.015] dark:bg-white/[0.04] shadow-sm dark:shadow-black/20 border border-[var(--color-border-light)] px-3.5 py-2 rounded-xl text-[13px] hover:border-[var(--color-border)] transition-colors w-full">
            <MapPin className="w-[16px] h-[16px] text-[var(--color-text-muted)] shrink-0" />
            <span className="font-medium text-[var(--color-text-primary)] capitalize tracking-wide truncate">
              {event.location}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 bg-black/[0.015] dark:bg-white/[0.04] shadow-sm dark:shadow-black/20 border border-[var(--color-border-light)] px-3.5 py-2 rounded-xl text-[13px] hover:border-[var(--color-border)] transition-colors w-full min-w-0">
              <Award className="w-[16px] h-[16px] text-[var(--color-text-muted)] shrink-0" />
              <span className="font-medium text-[var(--color-text-primary)] tracking-wide truncate">
                {event.credits} Credits
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-black/[0.015] dark:bg-white/[0.04] shadow-sm dark:shadow-black/20 border border-[var(--color-border-light)] px-3.5 py-2 rounded-xl text-[13px] hover:border-[var(--color-border)] transition-colors w-full min-w-0">
              <Users className="w-[16px] h-[16px] text-[var(--color-text-muted)] shrink-0" />
              <span className="font-medium text-[var(--color-text-primary)] tracking-wide truncate">
                <span className="text-[var(--color-text-muted)] font-normal mr-1 max-[380px]:hidden">Capacity:</span>
                {event.capacity === -1 ? 'Unlimited' : event.capacity}
              </span>
            </div>
          </div>

        </div>

        {/* Description Area */}
        <div className="mt-auto rounded-xl p-3.5 bg-[var(--color-surface)] border border-[var(--color-border-light)]">
           <p className="text-[13px] text-[var(--color-text-secondary)] font-medium line-clamp-2 leading-relaxed">
             {event.description || 'No description available for this event.'}
           </p>
        </div>

      </div>

      {/* Footer / Actions */}
      <div className="px-5 pb-5">
         <div className="w-full h-px bg-[var(--color-border-light)] mb-4" />
         
         <div className="flex items-center justify-between">
          <Link 
            href={`/student/events/${event.id}`}
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80 transition-colors group/link"
          >
             View Details
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/link:translate-x-0.5 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </Link>
          
          {event.status === 'COMPLETED' ? (
             <div className="flex items-center gap-2 opacity-80">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
               <span className="text-[13.5px] font-semibold text-[var(--color-text-muted)]">Completed</span>
             </div>
          ) : eventWithRsvp.rsvp ? (
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[13.5px] font-bold text-emerald-600 dark:text-emerald-400">Registered</span>
               </div>
               <div className="w-px h-3.5 bg-[var(--color-border-light)]" />
               <button 
                 type="button"
                 onClick={handleRsvpCancel} 
                 disabled={rsvpLoading}
                 className="text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {rsvpLoading ? '…' : 'Cancel RSVP'}
               </button>
             </div>
          ) : (
             <button 
               type="button"
               onClick={handleRsvpButton}
               disabled={rsvpLoading}
               className="flex items-center gap-1.5 text-[13.5px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-md transition-all duration-200 px-4 py-2 rounded-[10px] shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
             >
               {rsvpLoading ? 'Saving…' : 'RSVP Now'}
             </button>
          )}
         </div>
      </div>

    </div>
  );
};

