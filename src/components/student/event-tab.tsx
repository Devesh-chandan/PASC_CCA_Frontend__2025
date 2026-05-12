'use client';
import { EventWithRsvp, Rsvp } from '@/types/events';
import { useState, useEffect, useCallback } from 'react';
import { EventCard } from '@/components/student/event-card';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const PAGE_SIZE = 6;

const TABS = [
  { value: 'all-events', label: 'All Events' },
  { value: 'my-events', label: 'My Events' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
] as const;

// ---------- Reusable Pagination ----------
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
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={'dots-' + idx} className="px-2 py-2 text-[var(--color-text-muted)] text-sm select-none">
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
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------- Main component ----------
export const EventsTab = ({ eventsWithRsvp }: { eventsWithRsvp: EventWithRsvp[] }) => {
  const [list, setList] = useState<EventWithRsvp[]>(eventsWithRsvp);

  useEffect(() => {
    setList(eventsWithRsvp);
  }, [eventsWithRsvp]);

  const patchEventRsvp = useCallback((eventId: number, rsvp: Rsvp | null) => {
    setList((prev) =>
      prev.map((row) => (row.event.id === eventId ? { ...row, rsvp } : row))
    );
  }, []);

  const [activeTab, setActiveTab] = useState('all-events');
  const [searchQuery, setSearchQuery] = useState('');

  const [pages, setPages] = useState<Record<string, number>>({
    'all-events': 1,
    'my-events': 1,
    upcoming: 1,
    ongoing: 1,
    completed: 1,
  });

  const setPage = (tab: string, page: number) =>
    setPages((prev) => ({ ...prev, [tab]: page }));

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPages({ 'all-events': 1, 'my-events': 1, upcoming: 1, ongoing: 1, completed: 1 });
  };

  const filterEvents = (status?: string) => {
    let filtered = list;

    if (status === 'my-events') {
      filtered = filtered.filter((e) => e.rsvp !== null && e.rsvp !== undefined);
    } else if (status && status !== 'all-events') {
      filtered = filtered.filter((e) => e.event.status === status.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.event.title.toLowerCase().includes(q) ||
          e.event.description.toLowerCase().includes(q) ||
          e.event.location.toLowerCase().includes(q)
      );
    }

    if (status === 'all-events' || !status) {
      const statusOrder: Record<string, number> = {
        ONGOING: 1,
        UPCOMING: 2,
        COMPLETED: 3,
      };
      filtered.sort((a, b) => {
        const orderA = statusOrder[a.event.status?.toUpperCase()] || 4;
        const orderB = statusOrder[b.event.status?.toUpperCase()] || 4;
        return orderA - orderB;
      });
    }

    return filtered;
  };

  const getTabContent = (tabValue: string) => {
    const filteredEvents = filterEvents(tabValue);
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
    const currentPage = Math.min(pages[tabValue] ?? 1, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paginated = filteredEvents.slice(start, start + PAGE_SIZE);

    if (filteredEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-primary)] font-medium">No events found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Check back later for new events'}
          </p>
        </div>
      );
    }

    return (
      <div>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5 tabular-nums">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, filteredEvents.length)} of{' '}
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((eventWithRsvp, index) => (
            <EventCard
              key={eventWithRsvp.event.id ?? index}
              eventWithRsvp={eventWithRsvp}
              onRsvpChange={patchEventRsvp}
            />
          ))}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setPage(tabValue, page)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4.5 h-4.5" />
        <input
          type="text"
          placeholder="Search events by title, description, or location…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] focus:border-transparent transition-shadow"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Pills */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 md:gap-3 items-center">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold tracking-[0.01em] text-center whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-[var(--color-button-primary)] text-white shadow-sm ring-1 ring-[var(--color-button-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-light)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {getTabContent(activeTab)}
    </div>
  );
};