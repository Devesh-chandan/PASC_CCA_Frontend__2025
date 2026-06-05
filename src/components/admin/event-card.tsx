import { Event } from "@/types/events";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { BarChart3, Edit, Users, Clock, FolderOpen, Image, Trash2, Loader2, Calendar, MapPin, Award } from "lucide-react";
import { useState } from "react";
import { eventAPI } from "@/lib/api";
import { getStatusBadgeVariant, getStatusColor, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


interface EventCardProps extends Event {
  onRefresh?: () => void;
}

export const EventCard = ({ onRefresh, ...event }: EventCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { success, error } = useToast();

  const getStatusBadge = (status: Event["status"]) => {
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

    const config = statusConfig[status] ?? statusConfig.UPCOMING;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-border-light)] shadow-sm text-xs ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        {status}
      </span>
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



  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await eventAPI.delete(event.id);
      success('Event Deleted', `"${event.title}" has been removed successfully.`);
      if (onRefresh) {
        onRefresh();
      }
    } catch (deleteErr) {
      console.error("Failed to delete event:", deleteErr);
      error('Deletion Failed', 'Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 w-full lg:w-auto">
          <div className="flex items-center flex-wrap gap-2.5">
            <h3 className="font-bold text-lg md:text-xl text-foreground leading-tight tracking-tight line-clamp-2" title={event.title}>
              {event.title}
            </h3>
            <div className="w-fit">{getStatusBadge(event.status)}</div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 mt-3">
            <div className="flex items-center gap-1.5 text-sm md:text-[14.5px] text-muted-foreground">
              <Calendar className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="font-medium text-[var(--color-text-secondary)]">
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm md:text-[14.5px] text-muted-foreground">
              <MapPin className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="font-medium text-[var(--color-text-secondary)] inline-block truncate max-w-[150px] sm:max-w-[250px]" title={event.location}>
                {event.location}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm md:text-[14.5px] text-muted-foreground">
              <Award className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="font-medium text-[var(--color-text-secondary)]">
                {event.credits} Credits
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm md:text-[14.5px] text-muted-foreground">
              <Users className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="font-medium text-[var(--color-text-secondary)]">
                Capacity: {event.capacity <= 0 ? 'Full' : event.capacity}
              </span>
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
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Are you sure you want to delete the event "{event.title}"? This action cannot be undone and will remove the event for all students.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
