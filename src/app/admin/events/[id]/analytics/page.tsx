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
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { analyticsAPI, eventAPI, rsvpAPI, reviewAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateTime } from '@/lib/utils';

// Mapper function to transform backend API response to EventAnalytics interface
function mapEventAnalytics(apiData: any, reviewsList: any[] = []): EventAnalytics {
  const rav = apiData.message === "Event not found" ? {} : apiData;

  // Handle case where reviews list might come from API or separate fetch
  const reviews = Array.isArray(reviewsList) && reviewsList.length > 0
    ? reviewsList
    : (Array.isArray(apiData.reviews?.list) ? apiData.reviews.list : []);

  // Calculate total credits from attendance list if available
  const calculatedCredits = Array.isArray(apiData.attendanceList)
    ? apiData.attendanceList.reduce((sum: number, item: any) => sum + (item.session?.credits || 0), 0)
    : 0;

  return {
    eventId: apiData.event?.id ?? 0,
    eventTitle: apiData.event?.title ?? '',
    totalRsvps: apiData.rsvpStats?.total ?? apiData.totalRsvps ?? 0,
    totalAttendance: apiData.attendanceStats?.totalAttendances ?? apiData.totalAttendance ?? 0,
    attendanceRate: parseFloat(apiData.attendanceStats?.attendanceRate ?? apiData.attendanceRate ?? 0),
    averageRating: parseFloat(apiData.reviews?.averageRating ?? apiData.averageRating ?? 0),
    totalCreditsDistributed: apiData.creditsDistributed ?? calculatedCredits ?? 0,
    sessionsCount: apiData.sessions?.length ?? apiData.sessionStats?.length ?? 0,
    reviewsCount: apiData.reviews?.totalReviews ?? apiData.totalReviews ?? reviews.length ?? 0,
    reviews: {
      averageRating: parseFloat(apiData.reviews?.averageRating ?? apiData.averageRating ?? 0),
      totalReviews: apiData.reviews?.totalReviews ?? apiData.totalReviews ?? reviews.length ?? 0,
      list: reviews
    },
    attendanceList: Array.isArray(apiData.attendanceList) ? apiData.attendanceList : [],
    sessionStats: Array.isArray(apiData.sessions) ? apiData.sessions : (Array.isArray(apiData.sessionStats) ? apiData.sessionStats : [])
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

  const filteredRsvps = rsvps.filter(rsvp => {
    if (rsvpFilter === 'WAITLISTED') return rsvp.status === 'WAITLISTED';
    if (rsvpFilter === 'CONFIRMED') return rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING';
    return true;
  });

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
        // Refresh everything
        await Promise.all([
          fetchAnalytics(eventId),
          fetchRsvps(eventId)
        ]);
      } else if (response.data?.message?.includes('capacity') && !force) {
        if (confirm('Event is at full capacity. Do you want to force-approve (override capacity)?')) {
          handleApproveRsvp(rsvpId, true);
        }
      } else {
        alert(response.data?.message || 'Failed to approve RSVP');
      }
    } catch (error: any) {
      console.error('Error approving RSVP:', error);
      const errorMsg = error.response?.data?.message || 'Error occurred while approving';
      if (errorMsg.includes('capacity') && !force) {
        if (confirm('Event is at full capacity. Do you want to force-approve (override capacity)?')) {
          handleApproveRsvp(rsvpId, true);
        }
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleRejectRsvp = async (rsvpId: number) => {
    if (!confirm('Are you sure you want to reject this RSVP?')) return;
    try {
      const response = await rsvpAPI.reject(rsvpId);
      if (response.data?.success) {
        // Refresh everything
        await Promise.all([
          fetchAnalytics(eventId),
          fetchRsvps(eventId)
        ]);
      }
    } catch (error) {
      console.error('Error rejecting RSVP:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ONGOING': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const adminHoverCardClass = 'shadow-sm hover:shadow-md transition-shadow duration-300';
  const overviewHeroPanelClass = `rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-7 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] ${adminHoverCardClass}`;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
          ) : event ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">{event.title}</h1>
                  <Badge className={getStatusColor(event.status)} variant="secondary">{event.status}</Badge>
                </div>
                <p className="text-muted-foreground max-w-2xl">{event.description}</p>
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border-light)] shadow-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(event.startDate)}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border-light)] shadow-sm">
                    📍 {event.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border-light)]">
                  <BarChart3 className="w-5 h-5 text-[var(--color-info)]" />
                  <span className="font-semibold text-foreground text-sm">Event Analytics</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            title="Total RSVPs"
            value={analytics?.totalRsvps ?? rsvps.length}
            subtitle={`${event?.maxCapacity ? `of ${event.maxCapacity} capacity` : 'registered'}`}
            loading={loading}
          />
          <MetricCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Attendance"
            value={analytics?.totalAttendance ?? analytics?.attendanceList?.length ?? 0}
            subtitle={`${analytics?.attendanceRate ?? 0}% attendance rate`}
            loading={loading}
          />
          <MetricCard
            icon={<Award className="w-5 h-5" />}
            title="Credits Distributed"
            value={analytics?.totalCreditsDistributed ?? 0}
            subtitle={`${analytics?.sessionsCount ?? 0} sessions`}
            loading={loading}
          />
          <MetricCard
            icon={<Star className="w-5 h-5" />}
            title="Average Rating"
            value={analytics?.averageRating?.toFixed(1) ?? '0.0'}
            subtitle={`${analytics?.reviewsCount ?? analytics?.reviews?.list?.length ?? 0} reviews`}
            loading={loading}
          />
        </div>

        {/* Attendance Progress */}
        {analytics && analytics.totalRsvps > 0 && (
          <div className={overviewHeroPanelClass}>
            <div className="flex items-center mb-6">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#2BA6DF] border border-[#55B8E5]">
                  <TrendingUp className="w-4 h-4 text-white" />
                </span>
                <h3 className="text-xl sm:text-[21px] font-semibold tracking-tight text-foreground">
                  Attendance Overview
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold text-foreground">{analytics.attendanceRate}%</span>
                </div>
                <Progress value={analytics.attendanceRate} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-2xl font-bold text-foreground">{analytics.totalRsvps}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">RSVPs</p>
                </div>
                <div className="text-center p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.totalAttendance}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Attended</p>
                </div>
                <div className="text-center p-4 bg-gray-50/50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{analytics.totalRsvps - analytics.totalAttendance}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">No-shows</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RSVP List */}
        <div className={overviewHeroPanelClass}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FDB811] border border-[#E5A50F]">
                <Users className="w-4 h-4 text-[#6b4e00]" />
              </span>
              <h3 className="text-xl sm:text-[21px] font-semibold tracking-tight text-foreground">
                RSVPs ({filteredRsvps.length})
              </h3>
            </div>
            <div className="flex gap-2 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full">
              <button
                onClick={() => setRsvpFilter('WAITLISTED')}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${rsvpFilter === 'WAITLISTED' ? 'bg-[var(--color-info)] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Waitlisted
              </button>
              <button
                onClick={() => setRsvpFilter('CONFIRMED')}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${rsvpFilter === 'CONFIRMED' ? 'bg-[var(--color-info)] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setRsvpFilter('ALL')}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${rsvpFilter === 'ALL' ? 'bg-[var(--color-info)] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No RSVPs found for this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Registered At</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredRsvps.map((rsvp, index) => (
                    <tr key={rsvp.id} className="hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border-light)] last:border-0">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{rsvp.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{rsvp.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {rsvp.user?.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {rsvp.user?.year ? `Year ${rsvp.user.year}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : rsvp.status === 'WAITLISTED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                : rsvp.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {rsvp.status}
                          {rsvp.waitlistPosition ? ` (#${rsvp.waitlistPosition})` : ''}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(rsvp.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {rsvp.status === 'WAITLISTED' && (
                          <>
                            <button
                              onClick={() => handleApproveRsvp(rsvp.id)}
                              className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRsvp(rsvp.id)}
                              className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                        {(rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING') && (
                          <button
                            onClick={() => handleRejectRsvp(rsvp.id)}
                            className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Credits & Attendance List */}
        <div className={overviewHeroPanelClass}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 border border-emerald-400">
                <Award className="w-4 h-4 text-white" />
              </span>
              <h3 className="text-xl sm:text-[21px] font-semibold tracking-tight text-foreground">
                Credits & Attendance ({analytics?.attendanceList?.length || 0})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !analytics?.attendanceList || analytics.attendanceList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="">
                  {analytics.attendanceList.map((record: any) => (
                    <tr key={record.id} className="hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border-light)] last:border-0">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{record.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{record.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.user?.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.session?.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono">
                          +{record.session?.credits}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(record.attendedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className={overviewHeroPanelClass}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500 border border-purple-400">
                <Star className="w-4 h-4 text-white" />
              </span>
              <h3 className="text-xl sm:text-[21px] font-semibold tracking-tight text-foreground">
                Student Reviews ({analytics?.reviews?.list?.length ?? analytics?.reviewsCount ?? 0})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !analytics?.reviews?.list || analytics.reviews.list.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.reviews.list.map((review: any) => (
                <div key={review.id} className="border border-[var(--color-border-light)] rounded-xl p-5 bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {review.user?.name || 'Anonymous'}
                      </p>
                      {review.user?.department && (
                        <p className="text-xs text-muted-foreground">{review.user.department}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xl font-bold">{review.rating}</span>
                      <span className="text-sm text-muted-foreground">/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90">{review.review}</p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main >
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  loading: boolean;
  color?: string;
}

function MetricCard({ icon, title, value, subtitle, loading }: MetricCardProps) {
  const baseCardClass = "rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-center relative group";

  if (loading) {
    return (
      <div className={baseCardClass}>
        <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={baseCardClass}>
      <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
        <span className="text-sm sm:text-base font-medium text-muted-foreground">{title}</span>
        <div className="text-muted-foreground/80 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl sm:text-4xl font-bold tracking-tight w-full text-left mb-1 text-foreground">{value}</div>
      <p className="text-xs sm:text-sm text-muted-foreground w-full text-left">{subtitle}</p>
    </div>
  );
}
