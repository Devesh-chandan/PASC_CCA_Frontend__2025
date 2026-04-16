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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ONGOING': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 self-start px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                {loading ? <Skeleton className="h-10 w-64" /> : event?.title}
              </h1>
              <p className="text-muted-foreground mt-1 text-base font-medium">
                Performance and engagement insights
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center mt-3 md:mt-0">
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
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
            {!loading && event?.status && (
              <Badge className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${getStatusColor(event.status)} shadow-sm border-0`}>
                {event.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            title="Total RSVPs"
            value={analytics?.totalRsvps ?? rsvps.length}
            subtitle={`${event?.maxCapacity ? `of ${event.maxCapacity} capacity` : 'registered'}`}
            loading={loading}
            color="bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Attendance"
            value={analytics?.totalAttendance ?? analytics?.attendanceList?.length ?? 0}
            subtitle={`${analytics?.attendanceRate ?? 0}% attendance rate`}
            loading={loading}
            color="bg-green-100/50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          />
          <MetricCard
            icon={<Award className="w-5 h-5" />}
            title="Credits Distributed"
            value={analytics?.totalCreditsDistributed ?? 0}
            subtitle={`${analytics?.sessionsCount ?? 0} sessions`}
            loading={loading}
            color="bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          />
          <MetricCard
            icon={<Star className="w-5 h-5" />}
            title="Average Rating"
            value={analytics?.averageRating?.toFixed(1) ?? '0.0'}
            subtitle={`${analytics?.reviewsCount ?? analytics?.reviews?.list?.length ?? 0} reviews`}
            loading={loading}
            color="bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Overview Card - Span 1 or 2 */}
          <div className="lg:col-span-1 rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Attendance Overview
              </h3>
            </div>

            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-3 px-1">
                    <span className="text-muted-foreground uppercase tracking-wider">Attendance Rate</span>
                    <span className="text-primary">{analytics?.attendanceRate}%</span>
                  </div>
                  <div className="h-4 w-full bg-accent rounded-full overflow-hidden border border-[var(--color-border-light)] p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${analytics?.attendanceRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics?.totalRsvps}</p>
                    <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/60 uppercase tracking-wider mt-1">RSVPs</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics?.totalAttendance}</p>
                    <p className="text-xs font-medium text-green-600/70 dark:text-green-400/60 uppercase tracking-wider mt-1">Attended</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    <span className="font-bold text-foreground">{analytics ? analytics.totalRsvps - analytics.totalAttendance : 0}</span> registered students did not attend.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Registered Students List - Span 2 */}
          <div className="lg:col-span-2 rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Registered Students
              </h3>
              {!loading && rsvps.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {rsvps.length} Total
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : rsvps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Users className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No registrations yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {rsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {rsvp.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-tight">{rsvp.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rsvp.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider h-6">
                        {rsvp.user?.department || 'N/A'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider h-6">
                        {rsvp.user?.year ? `Year ${rsvp.user.year}` : 'Year N/A'}
                      </Badge>
                      <Badge className={`text-[10px] font-medium uppercase tracking-wider h-6 ${rsvp.status === 'ATTENDING' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'}`}>
                        {rsvp.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid for Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credits & Attendance List */}
          <div className="rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="font-bold text-xl text-foreground flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-primary" />
              Recent Attendance
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : !analytics?.attendanceList || analytics.attendanceList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Award className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.attendanceList.map((record: any) => (
                  <div key={record.id} className="p-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{record.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{record.session?.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold text-primary border-primary/20 bg-primary/5">
                        +{record.session?.credits}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-10">
                      <span>{record.user?.department || 'Dept N/A'}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{formatDateTime(record.attendedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="font-bold text-xl text-foreground flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-primary" />
              Student Reviews
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : !analytics?.reviews?.list || analytics.reviews.list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Star className="w-12 h-12 opacity-20 mb-3" />
                <p className="font-medium">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {analytics.reviews.list.map((review: any) => (
                  <div key={review.id} className="relative p-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)] transition-all overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                        {review.user?.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{review.user?.name || 'Anonymous'}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{review.user?.department || 'Student'}</p>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 line-clamp-3 pl-3 border-l-2 border-primary/20 py-1">
                      "{review.review}"
                    </p>

                    <p className="text-[10px] font-medium text-muted-foreground/60 mt-3 text-right uppercase tracking-wider group-hover:text-primary transition-colors">
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  loading,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  loading: boolean;
  color: string;
}) {
  const baseCardClass = "rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center";

  if (loading) {
    return (
      <div className={baseCardClass}>
        <Skeleton className="h-10 w-10 mb-3 rounded-xl" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={`bg-[var(--color-card)] ${baseCardClass}`}>
      <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
        <span className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl ${color} shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-1">{value}</div>
      {subtitle && <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-2 px-2 py-1 bg-accent rounded-lg">{subtitle}</p>}
    </div>
  );
}

