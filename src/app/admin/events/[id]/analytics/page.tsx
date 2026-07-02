"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Award,
  Star,
  TrendingUp,
  Calendar,
  CheckCircle,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { analyticsAPI, eventAPI, rsvpAPI, reviewAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

// Mapper function to transform backend API response to EventAnalytics interface
function mapEventAnalytics(apiData: any, reviewsList: any[] = []): EventAnalytics {
  const data = apiData && apiData.message !== "Event not found" ? apiData : {};

  // Handle case where reviews list might come from API or separate fetch
  const reviews = Array.isArray(reviewsList) && reviewsList.length > 0
    ? reviewsList
    : (Array.isArray(data.reviews?.list) ? data.reviews.list : []);

  // Calculate total credits from attendance list if available
  const calculatedCredits = Array.isArray(data.attendanceList)
    ? data.attendanceList.reduce((sum: number, item: any) => sum + (item.session?.credits || 0), 0)
    : 0;

  return {
    eventId: data.event?.id ?? 0,
    eventTitle: data.event?.title ?? '',
    totalRsvps: data.rsvpStats?.total ?? data.totalRsvps ?? 0,
    totalAttendance: data.attendanceStats?.totalAttendances ?? data.totalAttendance ?? 0,
    attendanceRate: parseFloat(data.attendanceStats?.attendanceRate ?? data.attendanceRate ?? 0),
    averageRating: parseFloat(data.reviews?.averageRating ?? data.averageRating ?? 0),
    totalCreditsDistributed: data.creditsDistributed ?? calculatedCredits ?? 0,
    sessionsCount: data.sessions?.length ?? data.sessionStats?.length ?? 0,
    reviewsCount: data.reviews?.totalReviews ?? data.totalReviews ?? reviews.length ?? 0,
    reviews: {
      averageRating: parseFloat(data.reviews?.averageRating ?? data.averageRating ?? 0),
      totalReviews: data.reviews?.totalReviews ?? data.totalReviews ?? reviews.length ?? 0,
      list: reviews
    },
    attendanceList: Array.isArray(data.attendanceList) ? data.attendanceList : [],
    sessionStats: Array.isArray(data.sessions) ? data.sessions : (Array.isArray(data.sessionStats) ? data.sessionStats : [])
  };
}

interface EventAnalytics {
  eventId?: number;
  eventTitle?: string;
  totalRsvps: number;
  totalAttendance: number;
  attendanceRate: number;
  averageRating: number;
  totalCreditsDistributed: number;
  sessionsCount: number;
  reviewsCount: number;
  reviews?: {
    averageRating: number;
    totalReviews: number;
    list: Array<{
      id: number;
      rating: number;
      review: string;
      createdAt: string;
      user: {
        name: string;
        department: string | null;
      } | null;
    }>;
  };
  attendanceList?: Array<{
    id: number;
    user: {
      name: string;
      email: string;
      department: string | null;
      year: number | null;
    };
    session: {
      id: number;
      name: string;
      credits: number;
    };
    attendedAt: string;
  }>;
  sessionStats?: Array<{
    id: number;
    sessionName: string;
    attendanceCount: number;
    credits: number;
  }>;
}

export default function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number>(0);
  const [event, setEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpFilter, setRsvpFilter] = useState<'WAITLISTED' | 'CONFIRMED' | 'ALL'>('WAITLISTED');
  const { success, error: toastError, warning } = useToast();
  const [rejectRsvpId, setRejectRsvpId] = useState<number | null>(null);
  
  const [rsvpPage, setRsvpPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const RSVP_PAGE_SIZE = 20;
  const REVIEW_PAGE_SIZE = 10;

  const filteredRsvps = rsvps.filter(rsvp => {
    if (rsvpFilter === 'WAITLISTED') return rsvp.status === 'WAITLISTED';
    if (rsvpFilter === 'CONFIRMED') return rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING';
    return true;
  });

  useEffect(() => {
    setRsvpPage(1);
  }, [rsvpFilter]);

  const totalRsvpPages = Math.ceil(filteredRsvps.length / RSVP_PAGE_SIZE);
  const rsvpStartIndex = (rsvpPage - 1) * RSVP_PAGE_SIZE;
  const rsvpEndIndex = Math.min(rsvpStartIndex + RSVP_PAGE_SIZE, filteredRsvps.length);
  const paginatedRsvps = filteredRsvps.slice(rsvpStartIndex, rsvpEndIndex);

  const reviewsList = analytics?.reviews?.list || [];
  const totalReviewPages = Math.ceil(reviewsList.length / REVIEW_PAGE_SIZE);
  const paginatedReviews = reviewsList.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const numId = parseInt(id);
      setEventId(numId);
      await Promise.all([
        fetchEvent(numId),
        fetchAnalytics(numId),
        fetchRsvps(numId)
      ]);
      setLoading(false);
    };
    init();
  }, [params]);



  const fetchEvent = async (id: number) => {
    try {
      const response = await eventAPI.getById(id);
      if (response.data?.success && response.data.data) {
        setEvent(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchAnalytics = async (id: number) => {
    try {
      // Fetch analytics AND reviews in parallel
      const [analyticsResponse, reviewsResponse] = await Promise.all([
        analyticsAPI.getEventAnalytics(id),
        reviewAPI.getEventReviews(id).catch(() => ({ data: { success: false, data: [] } })) // gracefully handle reviews error
      ]);

      console.log('=== RAW API RESPONSE ===');
      console.log('Analytics Data:', analyticsResponse.data?.data);
      console.log('Reviews Data:', reviewsResponse.data?.data);
      console.log('========================');

      if (analyticsResponse.data?.success && analyticsResponse.data.data) {
        // Extract reviews list from reviews endpoint if available
        const reviewsList = reviewsResponse.data?.success ? reviewsResponse.data.data : [];

        const mappedAnalytics = mapEventAnalytics(analyticsResponse.data.data, reviewsList);
        console.log('=== MAPPED ANALYTICS ===');
        console.log('Mapped data:', mappedAnalytics);
        console.log('Reviews count:', mappedAnalytics.reviewsCount);
        console.log('Reviews list length:', mappedAnalytics.reviews?.list?.length);
        console.log('========================');

        setAnalytics(mappedAnalytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set complete default analytics structure if API fails
      setAnalytics({
        totalRsvps: 0,
        totalAttendance: 0,
        attendanceRate: 0,
        averageRating: 0,
        totalCreditsDistributed: 0,
        sessionsCount: 0,
        reviewsCount: 0,
        reviews: {
          averageRating: 0,
          totalReviews: 0,
          list: []
        },
        attendanceList: []
      });
    }
  };

  const fetchRsvps = async (id: number) => {
    try {
      const response = await rsvpAPI.getEventRsvps(id);
      if (response.data?.success && response.data.data) {
        setRsvps(response.data.data as any[]);
      }
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleApproveRsvp = async (rsvpId: number, force: boolean = false) => {
    try {
      const response = await rsvpAPI.approve(rsvpId, force);
      if (response.data?.success) {
        success('RSVP Approved', 'The student has been approved to attend the event.');
        // Refresh everything
        await Promise.all([
          fetchAnalytics(eventId),
          fetchRsvps(eventId)
        ]);
      } else if (response.data?.message?.includes('capacity') && !force) {
        warning('At Full Capacity', 'Event is at full capacity. Retrying with force-approve...');
        handleApproveRsvp(rsvpId, true);
      } else {
        toastError('Approval Failed', response.data?.message || 'Failed to approve RSVP');
      }
    } catch (approveErr: any) {
      console.error('Error approving RSVP:', approveErr);
      const errorMsg = approveErr.response?.data?.message || 'Error occurred while approving';
      if (errorMsg.includes('capacity') && !force) {
        warning('At Full Capacity', 'Event is at full capacity. Retrying with force-approve...');
        handleApproveRsvp(rsvpId, true);
      } else {
        toastError('Approval Failed', errorMsg);
      }
    }
  };

  const handleRejectRsvp = (rsvpId: number) => {
    setRejectRsvpId(rsvpId);
  };

  const handleRejectRsvpConfirm = async () => {
    if (rejectRsvpId === null) return;
    try {
      const response = await rsvpAPI.reject(rejectRsvpId);
      if (response.data?.success) {
        success('RSVP Revoked', 'The RSVP has been successfully revoked.');
        // Refresh everything
        await Promise.all([
          fetchAnalytics(eventId),
          fetchRsvps(eventId)
        ]);
      } else {
        toastError('Revocation Failed', response.data?.message || 'Failed to revoke RSVP');
      }
    } catch (err: any) {
      console.error('Error rejecting RSVP:', err);
      toastError('Revocation Failed', err.response?.data?.message || 'Failed to revoke RSVP');
    } finally {
      setRejectRsvpId(null);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20';
      case 'ONGOING': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'COMPLETED': return 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]';
      default: return 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]';
    }
  };

  const displayTotalAttendance = analytics?.totalAttendance ?? analytics?.attendanceList?.length ?? 0;
  const displayTotalRsvps = Math.max(analytics?.totalRsvps ?? 0, rsvps.length, displayTotalAttendance);
  const displayNoShows = Math.max(0, displayTotalRsvps - displayTotalAttendance);
  const displayAttendanceRate = displayTotalRsvps > 0
    ? Math.round((displayTotalAttendance / displayTotalRsvps) * 100)
    : 0;

  const adminHoverCardClass = 'shadow-sm hover:shadow-md transition-shadow duration-300';
  const overviewHeroPanelClass = `rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-7 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] ${adminHoverCardClass}`;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--color-border)]'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
        
        {/* Header */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-[var(--color-primary)] animate-pulse" />
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight break-words max-w-full">
                    {loading ? "Loading Event..." : event?.title || "Event Analytics"}
                  </h1>
                  {!loading && event && (() => {
                    const status = statusConfig[event.status] ?? statusConfig.UPCOMING;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--color-border-light)] shadow-sm text-xs font-semibold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`}></span>
                        {event.status}
                      </span>
                    );
                  })()}
                </div>
                
                {!loading && event ? (
                  <div className="space-y-1.5 mt-1">
                    <p className={`text-[13px] sm:text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-words max-w-4xl bg-[var(--color-surface)]/30 p-3.5 rounded-xl border border-[var(--color-border-light)]/40 ${!descExpanded ? 'line-clamp-3' : ''}`}>
                      {event?.description || "No description provided."}
                    </p>
                    {event?.description && event.description.length > 180 && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline ml-1"
                      >
                        {descExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                    Fetching statistics...
                  </p>
                )}

                {!loading && event && (
                  <div className="flex flex-wrap gap-2.5 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)]/30 text-[var(--color-text-secondary)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      {formatDateTime(event.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)]/30 text-[var(--color-text-secondary)]">
                      📍 {event.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center shrink-0 md:self-start">
              <button
                onClick={() => router.push('/admin/events')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--color-primary)]" />
                Back to Events
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  if (eventId) {
                    Promise.all([
                      fetchAnalytics(eventId),
                      fetchRsvps(eventId)
                    ]).then(() => setLoading(false));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 hover:border-[var(--color-primary)]/50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </header>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            title="Total RSVPs"
            value={displayTotalRsvps}
            subtitle={`${event?.maxCapacity ? `of ${event.maxCapacity} capacity` : 'registered'}`}
            loading={loading}
            color="border-[var(--color-border)] bg-[var(--color-card)]"
            iconColor="text-[var(--color-primary)]"
            iconBg="bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20"
          />
          <MetricCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Attendance"
            value={displayTotalAttendance}
            subtitle={`${displayAttendanceRate}% attendance rate`}
            loading={loading}
            color="border-[var(--color-border)] bg-[var(--color-card)]"
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
          />
          <MetricCard
            icon={<Award className="w-5 h-5" />}
            title="Credits Distributed"
            value={analytics?.totalCreditsDistributed ?? 0}
            subtitle={`${analytics?.sessionsCount ?? 0} sessions`}
            loading={loading}
            color="border-[var(--color-border)] bg-[var(--color-card)]"
            iconColor="text-amber-600 dark:text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
          />
          <MetricCard
            icon={<Star className="w-5 h-5" />}
            title="Average Rating"
            value={analytics?.averageRating?.toFixed(1) ?? '0.0'}
            subtitle={`${analytics?.reviewsCount ?? analytics?.reviews?.list?.length ?? 0} reviews`}
            loading={loading}
            color="border-[var(--color-border)] bg-[var(--color-card)]"
            iconColor="text-amber-500 fill-amber-500/10"
            iconBg="bg-amber-500/10 border-amber-500/20"
          />
        </div>

        {/* Attendance Progress Section */}
        {!loading && displayTotalRsvps > 0 && (
          <div className={overviewHeroPanelClass}>
            <div className="flex items-center mb-6">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                  <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                </span>
                <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-foreground">
                  Attendance Overview
                </h3>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-5 bg-[var(--color-surface)]/40 border border-[var(--color-border-light)] rounded-2xl shadow-sm hover:bg-[var(--color-surface)]/60 transition-colors duration-200">
                <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{displayTotalRsvps}</p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-2.5">RSVPs</p>
              </div>
              <div className="text-center p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 transition-colors duration-200">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{displayTotalAttendance}</p>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider mt-2.5">Attended</p>
              </div>
              <div className="text-center p-5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl shadow-sm hover:bg-red-500/10 dark:hover:bg-red-500/15 transition-colors duration-200">
                <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 leading-none">{displayNoShows}</p>
                <p className="text-[11px] text-red-600/80 dark:text-red-400/80 font-bold uppercase tracking-wider mt-2.5">No-shows</p>
              </div>
              <div className="text-center p-5 bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-2xl shadow-sm hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/15 transition-colors duration-200">
                <p className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] leading-none">{displayAttendanceRate}%</p>
                <p className="text-[11px] text-[var(--color-primary)]/80 font-bold uppercase tracking-wider mt-2.5">Attendance Rate</p>
              </div>
            </div>
          </div>
        )}

        {/* RSVP Management List */}
        <div className={overviewHeroPanelClass}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                <Users className="w-5 h-5 text-[var(--color-primary)]" />
              </span>
              <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-foreground">
                Student RSVPs ({filteredRsvps.length > 0 ? `Showing ${rsvpStartIndex + 1}–${rsvpEndIndex} of ${filteredRsvps.length}` : '0'})
              </h3>
            </div>
            
            <div className="flex gap-1.5 p-1.5 bg-[var(--color-surface)]/50 border border-[var(--color-border-light)] rounded-xl shrink-0">
              {['WAITLISTED', 'CONFIRMED', 'ALL'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRsvpFilter(filter as any)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${rsvpFilter === filter ? 'bg-[var(--color-button-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
                >
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)]/30 rounded-2xl border border-dashed border-[var(--color-border-light)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-[var(--color-text-muted)]" />
              <p className="text-sm font-semibold">No RSVP records in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedRsvps.map((rsvp, index) => (
                <div key={rsvp.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-[var(--color-surface)]/20 hover:bg-[var(--color-surface)]/50 border border-[var(--color-border-light)] rounded-2xl shadow-sm transition-all duration-200 gap-4">
                  {/* Student profile */}
                  <div className="flex items-center gap-3 min-w-0 lg:w-[30%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-sm">
                      {rsvpStartIndex + index + 1}
                    </div>
                    <Avatar className="w-10 h-10 border border-[var(--color-border-light)] shrink-0 shadow-sm">
                      <AvatarFallback className="text-xs font-bold bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                        {rsvp.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-[14.5px] font-bold text-[var(--color-text-primary)] truncate leading-tight">{rsvp.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1 leading-tight truncate">{rsvp.user?.email}</p>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center justify-between flex-grow gap-4 text-xs text-[var(--color-text-muted)] lg:px-4">
                    <div className="lg:w-1/3 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block lg:hidden mb-1">Department</span>
                      <span className="text-[13px] sm:text-sm font-semibold text-foreground lg:font-semibold lg:text-[var(--color-text-secondary)] truncate block">{rsvp.user?.department || 'IT'}</span>
                    </div>
                    <div className="lg:w-1/4">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block lg:hidden mb-1">Year</span>
                      <span className="text-[13px] sm:text-sm font-semibold text-foreground lg:font-semibold lg:text-[var(--color-text-secondary)]">{rsvp.user?.year ? `Year ${rsvp.user.year}` : '-'}</span>
                    </div>
                    <div className="lg:w-2/5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block lg:hidden mb-1">Registered At</span>
                      <span className="text-[13px] sm:text-sm font-semibold text-foreground lg:font-semibold lg:text-[var(--color-text-secondary)]">{formatDateTime(rsvp.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t border-[var(--color-border-light)]/50 lg:border-0 lg:w-[25%] shrink-0">
                    <Badge
                      className={
                        rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold'
                          : rsvp.status === 'WAITLISTED'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold'
                            : rsvp.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)] font-bold'
                      }
                    >
                      {rsvp.status}
                      {rsvp.waitlistPosition ? ` (#${rsvp.waitlistPosition})` : ''}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {!event?.isDeleted && rsvp.status === 'WAITLISTED' && (
                        <>
                          <button
                            onClick={() => handleApproveRsvp(rsvp.id)}
                            className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-all shadow-sm active:scale-95"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRsvp(rsvp.id)}
                            className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm active:scale-95"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                      {!event?.isDeleted && (rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING') && (
                        <button
                          onClick={() => handleRejectRsvp(rsvp.id)}
                          className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm active:scale-95"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Pagination
                currentPage={rsvpPage}
                totalPages={totalRsvpPages}
                onPageChange={setRsvpPage}
              />
            </div>
          )}
        </div>

        {/* Student Reviews Panel */}
        <div className={overviewHeroPanelClass}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                <Star className="w-5 h-5 text-[var(--color-primary)]" />
              </span>
              <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-foreground">
                Student Reviews ({analytics?.reviews?.list?.length ?? analytics?.reviewsCount ?? 0})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : !analytics?.reviews?.list || analytics.reviews.list.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)]/30 rounded-2xl border border-dashed border-[var(--color-border-light)]">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-40 text-[var(--color-text-muted)]" />
              <p className="text-sm font-semibold">No reviews yet for this event</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedReviews.map((review: any) => {
                const initials = review.user?.name ? review.user.name[0].toUpperCase() : 'U';
                return (
                  <div key={review.id} className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)]">
                      {initials}
                    </div>
                    
                    {/* Review Info */}
                    <div className="flex-grow min-w-0 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-[15px] sm:text-base text-[var(--color-text-primary)] leading-tight block">
                            {review.user?.name || 'Anonymous Student'}
                          </span>
                          {review.user?.department && (
                            <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-0.5">{review.user.department}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-start sm:items-end shrink-0">
                          {renderStars(review.rating)}
                          <span className="text-[11px] text-[var(--color-text-muted)] font-medium mt-1">
                            {formatDateTime(review.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm sm:text-[14.5px] text-[var(--color-text-secondary)] font-medium leading-relaxed bg-[var(--color-surface)]/40 p-3.5 rounded-xl border border-[var(--color-border-light)]/40">
                        "{review.review || 'No written comment left.'}"
                      </p>
                    </div>
                  </div>
                );
              })}

              <Pagination
                currentPage={reviewPage}
                totalPages={totalReviewPages}
                onPageChange={setReviewPage}
              />
            </div>
          )}
        </div>

      </div>

      {/* RSVP Revoke Confirmation Dialog */}
      <Dialog open={rejectRsvpId !== null} onOpenChange={(open) => { if (!open) setRejectRsvpId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke RSVP?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Are you sure you want to revoke this student's RSVP? This action will remove them from the registry.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectRsvpId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectRsvpConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  loading: boolean;
  color: string;
  iconColor: string;
  iconBg: string;
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  loading,
  color,
  iconColor,
  iconBg,
}: MetricCardProps) {
  const baseCardClass = "rounded-2xl sm:rounded-[1.5rem] border p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between group";

  if (loading) {
    return (
      <div className={`${color} ${baseCardClass} min-h-[160px]`}>
        <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    );
  }

  return (
    <div className={`${color} ${baseCardClass} min-h-[160px]`}>
      <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
        <span className="text-sm sm:text-base font-semibold text-[var(--color-text-muted)]">{title}</span>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${iconBg} shrink-0 transition-transform group-hover:scale-110`}>
          <span className={iconColor}>{icon}</span>
        </span>
      </div>
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">{value}</div>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1">{subtitle}</p>
      )}
    </div>
  );
}
