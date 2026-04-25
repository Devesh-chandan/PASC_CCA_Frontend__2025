'use client';
import React from 'react';
import { EventsTab } from '@/components/student/event-tab';
import { useFetchEventsForStudentRsvp } from '@/hooks/events';
import { EventWithRsvp } from '@/types/events';
import { Calendar, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
  const { events, loading, error } = useFetchEventsForStudentRsvp();
  const eventsWithRsvp = events;
  const totalEvents = eventsWithRsvp.length;
  const activeEvents = eventsWithRsvp.filter(
    (e: EventWithRsvp) => e.event.status === 'ONGOING' || e.event.status === 'UPCOMING'
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
          <div>
            <Skeleton className="h-10 w-56 mb-3" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">

        {/* ─── Header ─── */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
                  CCA Events
                </h1>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Discover and participate in co-curricular activities
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 p-2.5 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-surface)]/70 border border-[var(--color-border-light)] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[11px] font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Total</p>
                <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)] leading-none mt-1">{totalEvents}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 p-2.5 text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-500/10 border border-green-500/20 mb-1">
                  <Zap className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-[11px] font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Active</p>
                <p className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400 leading-none mt-1">{activeEvents}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Events ─── */}
        <EventsTab eventsWithRsvp={eventsWithRsvp} />
      </div>
    </main>
  );
}
