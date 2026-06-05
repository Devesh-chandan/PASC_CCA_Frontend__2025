'use client';

import { useState, useEffect } from 'react';
import { announcementAPI } from '@/lib/api';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Skeleton } from '../ui/skeleton';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- Reusable Pagination bar ----------
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className='flex items-center justify-center gap-1.5 mt-8'>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className='w-4 h-4' /> Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={'dots-' + idx} className='px-2 py-2 text-[var(--color-text-muted)] text-sm select-none'>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={
              'w-10 h-10 rounded-xl text-sm font-medium transition-all border ' +
              (currentPage === page
                ? 'bg-[var(--color-button-primary)] text-white border-transparent shadow-sm'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]')
            }
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

/**
 * AdminNotificationList — mirrors NotificationList for students but
 * fetches admin announcements and renders them as Notification items.
 */
export function AdminNotificationList() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await announcementAPI.getAllAdmin({ limit: 50 });
            if (response.data?.success && response.data.data) {
                const announcements = response.data.data as any[];
                setNotifications(
                    announcements.map((a: any) => ({
                        id: a.id,
                        title: a.title,
                        message: a.content || a.message || '',
                        read: false,
                        createdAt: a.createdAt,
                        type: 'ANNOUNCEMENT' as const,
                    }))
                );
            }
        } catch (err) {
            console.error('Error fetching admin announcements:', err);
            setError('Failed to load announcements. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = (notificationId: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
    };

    const handleMarkAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
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
            <div className='text-center py-12 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]'>
                <p className='text-red-500 mb-4'>{error}</p>
                <button onClick={fetchNotifications} className='text-[var(--color-primary)] hover:underline font-medium'>
                    Try again
                </button>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className='text-center py-12 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]'>
                <Bell className='w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50' />
                <h3 className='text-lg font-medium'>No announcements</h3>
                <p className='text-muted-foreground'>No announcements have been sent yet.</p>
            </div>
        );
    }

    const hasUnread = notifications.some((n) => !n.read);
    const totalPages = Math.ceil(notifications.length / PAGE_SIZE);
    const paginatedNotifications = notifications.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className='space-y-4'>
            {hasUnread && (
                <div className='flex justify-end'>
                    <button
                        onClick={handleMarkAllAsRead}
                        className='text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] font-medium'
                    >
                        Mark all as read
                    </button>
                </div>
            )}
            <div className='space-y-3'>
                {paginatedNotifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                    />
                ))}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
