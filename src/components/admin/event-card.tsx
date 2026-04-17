import { Event } from "@/types/events";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { BarChart3, Edit, Users, Clock, FolderOpen, Image, Trash2, Loader2, Calendar, MapPin, Award } from "lucide-react";
import { useState } from "react";
import { eventAPI } from "@/lib/api";
import { getStatusBadgeVariant, getStatusColor, formatDate } from "@/lib/utils";


interface EventCardProps extends Event {
  onRefresh?: () => void;
}

export const EventCard = ({ onRefresh, ...event }: EventCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status: Event["status"]) => {
    const variants: Record<string, string> = {
      UPCOMING: "bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-500/20 font-semibold px-2.5 py-1 text-xs",
      COMPLETED: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)] font-medium px-2.5 py-1 text-xs",
      ONGOING: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500 border border-emerald-500/30 font-bold px-2.5 py-1 text-xs shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    };
    return (
      <Badge className={variants[status] || "bg-[var(--color-surface)] text-[var(--color-text-primary)]"}>
        {status === 'ONGOING' ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status}
          </span>
        ) : (
          status
        )}
      </Badge>
    );
  };

  // const formatDate = (date: string | Date) => {
  //   if (!date) return "—";

  //   const d = date instanceof Date ? date : new Date(date);

  //   if (isNaN(d.getTime())) return "—";

  //   return d.toLocaleDateString('en-GB', {
  //   year: 'numeric',
  //   month: 'short',
  //   day: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  //   timeZone: 'UTC'
  // });
  // };

  // export function formatDateTime(date: Date | string): string {
  // const d = new Date(date);
  // return d.toLocaleDateString('en-GB', {
  //   year: 'numeric',
  //   month: 'short',
  //   day: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  //   timeZone: 'UTC'
  // });



  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await eventAPI.delete(event.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h3 className="font-bold text-[20px] md:text-[22px] text-foreground leading-tight tracking-tight">
              {event.title}
            </h3>
            <div className="w-fit">{getStatusBadge(event.status)}</div>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] text-muted-foreground">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              </div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] text-muted-foreground">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              </div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {event.location}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] text-muted-foreground">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                </div>
                <span className="font-medium text-[var(--color-text-secondary)]">
                  {event.credits} Credits
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] text-muted-foreground">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                </div>
                <span className="font-medium text-[var(--color-text-secondary)]">
                  Capacity: {event.capacity <= 0 ? 'Full' : event.capacity}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push(`/admin/events/${event.id}/analytics`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => router.push(`/admin/events/${event.id}/sessions`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Clock className="w-4 h-4" />
            Sessions
          </button>
          <button
            onClick={() => router.push(`/admin/events/${event.id}/resources`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Resources
          </button>
          <button
            onClick={() => router.push(`/admin/events/${event.id}/gallery`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Image className="w-4 h-4" />
            Gallery
          </button>
          <button
            onClick={() => router.push(`/admin/editEvent/${event.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => router.push(`/admin/attendance/${event.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Users className="w-4 h-4" />
            Attendance
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
