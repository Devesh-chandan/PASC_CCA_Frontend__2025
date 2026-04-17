"use client";

import { useState, useEffect } from 'react';
import { Announcement } from '@/types/announcement';
import { announcementAPI } from '@/lib/api';
import { AnnouncementCard } from './AnnouncementCard';
import { Megaphone } from 'lucide-react';

export function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAll({ limit: 20 });
      if (response.data?.success && response.data.data) {
        setAnnouncements(response.data.data as Announcement[]);
      }
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      if (error.response?.status === 403) {
        setError("Access Denied: You might be logged in as an Admin. Please logout and login as a Student.");
      } else {
        setError("Failed to load announcements.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await announcementAPI.markAsRead(id);
      setAnnouncements(announcements.map(a =>
        a.id === id ? { ...a, isRead: true } : a
      ));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-4 md:p-5 animate-pulse bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
             <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] flex-shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                   <div className="flex justify-between">
                       <div className="h-2.5 bg-[var(--color-surface)] w-1/4 rounded" />
                       <div className="h-2.5 bg-[var(--color-surface)] w-12 rounded" />
                   </div>
                   <div className="h-3.5 bg-[var(--color-surface)] w-3/4 rounded" />
                   <div className="h-2.5 bg-[var(--color-surface)] w-full rounded mt-2" />
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-14 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-[0_1px_3px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.05)]">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[var(--color-primary)] hover:underline font-medium">
          Try again
        </button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-14 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] shadow-[0_1px_3px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.05)]">
        <Megaphone className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-60" />
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No announcements</h3>
        <p className="text-[var(--color-text-muted)] mt-1">
          You will see announcements here when there are updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map(announcement => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onMarkAsRead={handleMarkAsRead}
        />
      ))}
    </div>
  );
}

