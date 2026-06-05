"use client";

import { useState, useEffect } from 'react';
import { Download, Users, Mail, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { rsvpAPI } from '@/lib/api';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface AttendeeListProps {
    eventId: number;
}

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
    <div className='flex items-center justify-center gap-1.5 mt-6'>
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

export function AttendeeList({ eventId }: AttendeeListProps) {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 25;

    useEffect(() => {
        fetchAttendees();
        setCurrentPage(1);
    }, [eventId]);

    const fetchAttendees = async () => {
        try {
            const response = await rsvpAPI.getEventRsvps(eventId);
            if (response.data?.success && response.data.data) {
                setAttendees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching attendees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (attendees.length === 0) return;

        const headers = ['Name', 'Email', 'Department', 'Year', 'Status', 'RSVP Date'];
        const csvData = attendees.map(a => [
            a.user.name,
            a.user.email,
            a.user.department,
            a.user.year,
            a.status,
            new Date(a.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendees_event_${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (attendees.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No attendees yet</p>
                <p className="text-sm">When students RSVP, they will appear here.</p>
            </div>
        );
    }

    const totalPages = Math.ceil(attendees.length / PAGE_SIZE);
    const paginatedAttendees = attendees.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(currentPage * PAGE_SIZE, attendees.length);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                        <Users className="w-5 h-5 text-[var(--color-primary)]" />
                    </span>
                    <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-foreground">
                        Registration Details
                        <span className="ml-2.5 text-sm sm:text-base font-semibold text-muted-foreground">({attendees.length})</span>
                    </h3>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload} className="border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] hover:text-foreground transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {attendees.length > 0 && (
                <div className="text-xs sm:text-sm text-muted-foreground font-medium relative z-10 mt-[-12px] mb-[-4px]">
                    Showing {startIndex}–{endIndex} of {attendees.length} registrations
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/30 custom-scrollbar relative z-10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--color-surface-hover)]/60 text-muted-foreground font-bold border-b border-[var(--color-border-light)]">
                        <tr>
                            <th className="px-5 py-4 text-xs uppercase tracking-wider">Student Name</th>
                            <th className="px-5 py-4 text-xs uppercase tracking-wider">Department & Year</th>
                            <th className="px-5 py-4 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-5 py-4 text-xs uppercase tracking-wider">RSVP Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-light)]">
                        {paginatedAttendees.map((attendee) => (
                            <tr key={attendee.id} className="hover:bg-[var(--color-surface-hover)]/30 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-semibold text-foreground">{attendee.user.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                                        <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                        {attendee.user.email}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex flex-col font-medium text-foreground">
                                        <span className="flex items-center gap-1.5 text-[13px]">
                                            <GraduationCap className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                            {attendee.user.department}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">Year {attendee.user.year}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                        attendee.status === 'CONFIRMED' || attendee.status === 'ATTENDING' 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                            : attendee.status === 'WAITLISTED'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                : attendee.status === 'REJECTED'
                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]'
                                        }`}>
                                        {attendee.status}
                                        {attendee.waitlistPosition ? ` (#${attendee.waitlistPosition})` : ''}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                    {new Date(attendee.rsvpDate).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        timeZone: 'UTC'
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
