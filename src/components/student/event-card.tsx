import { EventWithRsvp } from '@/types/events';
import { Calendar, MapPin, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { rsvpAPI } from '@/lib/api';

/* ──── Status badge colours ──── */
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING: {
    bg: 'bg-[var(--color-primary)]/10',
    text: 'text-[var(--color-primary)]',
    dot: 'bg-[var(--color-primary)]',
  },
  ONGOING: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-900/25',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-green-500',
  },
  COMPLETED: {
    bg: 'bg-[var(--color-primary)]/10',
    text: 'text-[var(--color-primary)]',
    dot: 'bg-[var(--color-primary)]',
  },
};

export const EventCard = ({ eventWithRsvp }: { eventWithRsvp: EventWithRsvp }) => {
  const event = eventWithRsvp.event;
  const status = statusConfig[event.status] ?? statusConfig.UPCOMING;
  const statusLabel = event.status.charAt(0) + event.status.slice(1).toLowerCase();

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
        alert('Please login first');
        return;
      }
      await rsvpAPI.create(event.id);
      alert('RSVP successful!');
      window.location.reload();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || 'Failed to RSVP. Please try again.';
      alert(errorMessage);
    }
  }

  async function handleRsvpCancel() {
    try {
      if (!eventWithRsvp.rsvp?.id) {
        alert('No RSVP found to cancel');
        return;
      }
      await rsvpAPI.cancel(eventWithRsvp.rsvp.id);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel RSVP. Please try again.');
    }
  }

  return (
    <div className="group rounded-[1.25rem] bg-[var(--color-card)] shadow-sm hover:shadow-md border border-[var(--color-border-light)] hover:border-[var(--color-border)] transition-all duration-300 overflow-hidden flex flex-col p-5 sm:p-6 pb-4 relative">
      
      {/* Title + Badge */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 pr-2">
          <h3 className="text-xl sm:text-[22px] font-bold text-[var(--color-text-primary)] leading-tight tracking-tight break-words">
            {event.title}
          </h3>
        </div>
        <span
          className={`shrink-0 flex items-center justify-center p-2 rounded-xl text-[11px] font-bold tracking-wide ${status.bg} ${status.text} border border-current/10 whitespace-nowrap leading-none h-fit min-w-[70px] text-center uppercase`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Meta Grid - matching the reference layout */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 mb-7">
        {/* Date */}
        <div>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[var(--color-text-primary)] mb-1">
            {new Date(event.startDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <p className="text-[13.5px] text-[var(--color-text-muted)] tracking-wide font-medium">Date</p>
        </div>

        {/* Time */}
        <div>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[var(--color-text-primary)] mb-1">
            {new Date(event.startDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })} - {new Date(event.endDate).toLocaleTimeString('en-US', {
               hour: '2-digit',
               minute: '2-digit'
            })}
          </p>
          <p className="text-[13.5px] text-[var(--color-text-muted)] tracking-wide font-medium">Time</p>
        </div>

        {/* Location */}
        <div>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[var(--color-text-primary)] mb-1 truncate">
            {event.location}
          </p>
          <p className="text-[13.5px] text-[var(--color-text-muted)] tracking-wide font-medium">Location</p>
        </div>

        {/* Credits / Color matching reference */}
        <div>
          <div className="flex items-center gap-2 mb-1 h-[24px]">
             <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
               <Award className="w-3.5 h-3.5" />
             </span>
             <p className="text-[15px] sm:text-[16px] font-semibold text-[var(--color-text-primary)] leading-none">
               {event.credits}
             </p>
          </div>
          <p className="text-[13.5px] text-[var(--color-text-muted)] tracking-wide font-medium">Credits</p>
        </div>
      </div>

      <div className="w-full h-px bg-[var(--color-border-light)] mb-6" />

      {/* Description Header + Text */}
      <div className="mb-6">
        <h4 className="text-[17px] font-semibold text-[var(--color-text-secondary)] mb-3">
          Description
        </h4>
        <p className="text-[14.5px] text-[var(--color-text-primary)] leading-[1.6] line-clamp-3 font-medium">
          {event.description || 'No description available for this event.'}
        </p>
      </div>

      {/* Decorative Banner Image (Geometric placeholder since no image URL exists natively) */}
      <div className="w-full h-[140px] rounded-[1.25rem] overflow-hidden bg-gradient-to-tr from-blue-500/20 via-purple-500/10 to-indigo-500/20 mb-6 flex items-center justify-center relative">
         <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center" />
         <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--color-border-light)] absolute bottom-3 right-3 flex items-center gap-1.5">
           <Users className="w-3.5 h-3.5 text-[var(--color-text-primary)]" />
           <span className="text-xs font-bold text-[var(--color-text-primary)]">{event.capacity <= 0 ? 'Full' : event.capacity + ' seats'}</span>
         </div>
      </div>

      {/* Bottom RSVP Checklist action resembling the reference image bottom */}
      <div className="mt-auto flex items-center justify-between gap-4 pt-1">
        {event.status === 'COMPLETED' ? (
           <div className="flex items-center gap-3 w-full opacity-60">
             <div className="w-5 h-5 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
             </div>
             <p className="text-[15px] font-semibold text-[var(--color-text-muted)]">Event has concluded</p>
           </div>
        ) : eventWithRsvp.rsvp ? (
           <>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    {eventWithRsvp.rsvp.status === 'WAITLISTED' ? 'Waitlisted' : 'You are going!'}
                 </p>
              </div>
              <button
                onClick={handleRsvpCancel}
                className="text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg shrink-0"
              >
                Cancel
              </button>
           </>
        ) : (
           <>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full border-[2.5px] border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center shrink-0" />
                 <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">Ready to join?</p>
              </div>
              <button
                onClick={handleRsvpButton}
                className="text-[14px] font-bold text-white transition-colors bg-[#1C1C1E] dark:bg-white dark:text-black hover:opacity-80 px-5 py-2 rounded-xl shrink-0"
              >
                RSVP Now
              </button>
           </>
        )}
      </div>

      {/* Details Overlay Link for expanding - absolute so we can click anywhere on top half if we wanted but let's just make it a clean top-right action or absolute wrapper later if needed. For now the UI is self-contained. */}
      {/* Alternatively, user can click Details somewhere. Let's add an absolute pseudo-link covering top part, or keep it distinct. */}
      {/* We will let existing flow dictate it, or add a subtle "Details" link */}
      <Link href={`/student/events/${event.id}`} className="absolute top-6 right-6 text-[12px] font-bold text-[var(--color-primary)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
        View details
      </Link>
    </div>
  );
};

