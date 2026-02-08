import { Event } from "@/types/events";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BarChart3, Edit, Users, Clock, FolderOpen, Image, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { eventAPI } from "@/lib/api";

interface EventCardProps extends Event {
  onRefresh?: () => void;
}

export const EventCard = ({ onRefresh, ...event }: EventCardProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status: Event["status"]) => {
    const variants: Record<string, string> = {
      UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      ONGOING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    // Use UTC to prevent timezone shifts
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    };
    return date.toLocaleDateString('en-GB', options);
  };

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
    <Card className="mb-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {formatDate(event.startDate)} - {formatDate(event.endDate)} • {event.location}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.credits} credits • Capacity: {event.capacity}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/events/${event.id}/analytics`)}
              className="flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/events/${event.id}/sessions`)}
              className="flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              Sessions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/events/${event.id}/resources`)}
              className="flex items-center gap-1"
            >
              <FolderOpen className="w-4 h-4" />
              Resources
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/events/${event.id}/gallery`)}
              className="flex items-center gap-1"
            >
              <Image className="w-4 h-4" />
              Gallery
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/editEvent/${event.id}`)}
              className="flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/attendance/${event.id}`)}
              className="flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              Attendance
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 bg-red-500"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
