"use client";

import { Notification, NotificationType } from '@/types/notification';
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trophy,
  Users,
  Megaphone,
  Clock,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  compact?: boolean;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  EVENT_REMINDER: (
    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
      <Calendar className="w-5 h-5 text-blue-500" />
    </div>
  ),
  EVENT_CREATED: (
    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
      <Calendar className="w-5 h-5 text-green-500" />
    </div>
  ),
  EVENT_UPDATED: (
    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
      <Calendar className="w-5 h-5 text-yellow-500" />
    </div>
  ),
  EVENT_CANCELLED: (
    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
      <AlertCircle className="w-5 h-5 text-red-500" />
    </div>
  ),
  RSVP_CONFIRMED: (
    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
      <CheckCircle className="w-5 h-5 text-green-500" />
    </div>
  ),
  RSVP_REJECTED: (
    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
      <XCircle className="w-5 h-5 text-red-500" />
    </div>
  ),
  WAITLIST_ADDED: (
    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
      <Clock className="w-5 h-5 text-orange-500" />
    </div>
  ),
  WAITLIST_PROMOTED: (
    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
      <Users className="w-5 h-5 text-purple-500" />
    </div>
  ),
  ATTENDANCE_MARKED: (
    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
      <CheckCircle className="w-5 h-5 text-blue-500" />
    </div>
  ),
  ANNOUNCEMENT: (
    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
      <Megaphone className="w-5 h-5 text-orange-500" />
    </div>
  ),
  ACHIEVEMENT: (
    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
      <Trophy className="w-5 h-5 text-yellow-500" />
    </div>
  ),
  GENERAL: (
    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
      <Bell className="w-5 h-5 text-[var(--color-primary)]" />
    </div>
  ),
};

export function NotificationItem({ notification, onMarkAsRead, compact = false }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer transition-[background-color,box-shadow,border-color] p-4 md:p-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] hover:bg-[var(--color-surface-hover)]/40 ${!notification.read
        ? 'shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]'
        : 'shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
        }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {notificationIcons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          {compact ? (
            <>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <h3 className={`text-[14px] md:text-[15px] font-semibold leading-tight ${!notification.read ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)] opacity-90'}`}>
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                </div>
                <p className='text-[11px] mt-[1px] text-[var(--color-text-muted)] font-medium tracking-wide flex-shrink-0' suppressHydrationWarning>
                  {formatDistanceToNow(new Date(notification.createdAt ?? notification.sentAt))}
                </p>
              </div>

              <p className={`text-[13px] md:text-sm ${!notification.read ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'} line-clamp-2 leading-[1.6]`}>
                {notification.message}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-[15px] md:text-base font-semibold leading-snug ${!notification.read ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)] opacity-90'}`}>
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className='text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide' suppressHydrationWarning>
                      {new Date(notification.createdAt ?? notification.sentAt).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric' })}
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)]/50">•</span>
                    <p className='text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide' suppressHydrationWarning>
                      {formatDistanceToNow(new Date(notification.createdAt ?? notification.sentAt))}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 mt-1 bg-emerald-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </div>

              <div className="mt-3 bg-[var(--color-surface)]/70 border border-[var(--color-border-light)]/40 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                <p className={`text-sm md:text-[15px] ${!notification.read ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'} whitespace-pre-wrap leading-[1.6]`}>
                  {notification.message}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


