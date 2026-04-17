"use client";

import { Announcement, AnnouncementPriority } from '@/types/announcement';
import { Megaphone, AlertCircle, Info, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface AnnouncementCardProps {
  announcement: Announcement;
  onMarkAsRead?: (id: number) => void;
}

const priorityConfig: Record<AnnouncementPriority, {
  icon: React.ReactNode;
  dotColor: string;
  shadowColor: string;
}> = {
  LOW: {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <Info className="w-5 h-5 text-blue-500" />
      </div>
    ),
    dotColor: 'bg-blue-500',
    shadowColor: 'rgba(59,130,246,0.8)',
  },
  NORMAL: {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
        <Megaphone className="w-5 h-5 text-green-500" />
      </div>
    ),
    dotColor: 'bg-emerald-500',
    shadowColor: 'rgba(16,185,129,0.8)',
  },
  HIGH: {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
      </div>
    ),
    dotColor: 'bg-yellow-500',
    shadowColor: 'rgba(234,179,8,0.8)',
  },
  URGENT: {
    icon: (
      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
    ),
    dotColor: 'bg-red-500',
    shadowColor: 'rgba(239,68,68,0.8)',
  },
};

export function AnnouncementCard({ announcement, onMarkAsRead }: AnnouncementCardProps) {
  const config = priorityConfig[announcement.priority] || priorityConfig.NORMAL;

  const handleClick = () => {
    if (!announcement.isRead && onMarkAsRead) {
      onMarkAsRead(announcement.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer transition-[background-color,box-shadow,border-color] p-4 md:p-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] hover:bg-[var(--color-surface-hover)]/40 ${!announcement.isRead 
        ? 'shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]' 
        : 'shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  {announcement.priority} PRIORITY
                </h4>
              </div>
              <h3 className={`text-[15px] md:text-base font-semibold leading-snug ${!announcement.isRead ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)] opacity-90'}`}>
                {announcement.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <p className='text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide' suppressHydrationWarning>
                  {new Date(announcement.createdAt).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric' })}
                </p>
                <span className="text-[10px] text-[var(--color-text-muted)]/50">•</span>
                <p className='text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide' suppressHydrationWarning>
                  {formatDistanceToNow(new Date(announcement.createdAt))}
                </p>
              </div>
            </div>
            {!announcement.isRead && (
              <div 
                className={`w-2 h-2 mt-1 rounded-full flex-shrink-0 ${config.dotColor}`} 
                style={{ boxShadow: `0 0 8px ${config.shadowColor}` }}
              />
            )}
          </div>
          
          <div className="mt-3 bg-[var(--color-surface)]/70 border border-[var(--color-border-light)]/40 p-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col gap-3">
            <p className={`text-sm md:text-[15px] ${!announcement.isRead ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'} whitespace-pre-wrap leading-[1.6]`}>
              {announcement.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
