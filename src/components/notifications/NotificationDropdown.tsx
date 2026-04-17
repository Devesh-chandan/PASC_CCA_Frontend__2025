'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Skeleton } from '../ui/skeleton';
import { Bell } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  role?: string;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationDropdown({
  notifications,
  loading,
  role,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleViewAll = () => {
    onClose();
    if (role === 'admin') {
      router.push('/admin/notifications');
    } else {
      router.push('/student/notifications');
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div
      ref={dropdownRef}
      className='absolute right-0 mt-2 w-[26rem] max-w-[calc(100vw-1.25rem)] bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.1),0_14px_30px_rgba(15,23,42,0.12)] z-50 max-h-[520px] overflow-hidden flex flex-col'
    >
      {/* Header */}
      <div className='p-4 border-b border-[var(--color-border-light)] flex items-center gap-3'>
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          <div className='w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0'>
            <Bell className='w-4 h-4 text-[var(--color-primary)]' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='font-semibold text-[var(--color-text-primary)] leading-none truncate'>
              {role === 'admin' ? 'Recent RSVPs' : 'Notifications'}
              <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-primary)]/12 border border-[var(--color-primary)]/25 text-[11px] font-semibold text-[var(--color-primary)] ml-2 align-middle'>
                {notifications.length} item{notifications.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className='text-xs sm:text-sm font-semibold text-[var(--color-primary)] hover:opacity-90 shrink-0 ml-2'
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className='overflow-y-auto flex-1'>
        {loading ? (
          <div className='p-4 space-y-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2 bg-[var(--color-surface)]/50 rounded-xl p-3'>
                <Skeleton className='h-4 w-3/4 rounded' />
                <Skeleton className='h-3 w-1/2 rounded' />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className='p-10 text-center text-[var(--color-text-muted)]'>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className='p-3 space-y-2.5'>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className='p-3 border-t border-[var(--color-border-light)] text-center bg-[var(--color-surface)]/45'>
          <button
            onClick={handleViewAll}
            className='text-sm text-[var(--color-primary)] hover:opacity-90 font-semibold'
          >
            {role === 'admin' ? 'View all announcements' : 'View all notifications'}
          </button>
        </div>
      )}
    </div>
  );
}
