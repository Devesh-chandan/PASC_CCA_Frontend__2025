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



  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
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
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
                  <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                </div>
                <p className="text-muted-foreground">{event.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(event.startDate)}
                  </span>
                  <span>📍 {event.location}</span>
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
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  <span className="font-semibold text-foreground">Event Analytics</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="w-6 h-6 text-blue-500" />}
            title="Total RSVPs"
            value={analytics?.totalRsvps ?? rsvps.length}
            subtitle={`${event?.maxCapacity ? `of ${event.maxCapacity} capacity` : 'registered'}`}
            loading={loading}
            color="bg-blue-50 dark:bg-blue-950/20"
          />
          <MetricCard
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
            title="Attendance"
            value={analytics?.totalAttendance ?? analytics?.attendanceList?.length ?? 0}
            subtitle={`${analytics?.attendanceRate ?? 0}% attendance rate`}
            loading={loading}
            color="bg-green-50 dark:bg-green-950/20"
          />
          <MetricCard
            icon={<Award className="w-6 h-6 text-yellow-500" />}
            title="Credits Distributed"
            value={analytics?.totalCreditsDistributed ?? 0}
            subtitle={`${analytics?.sessionsCount ?? 0} sessions`}
            loading={loading}
            color="bg-yellow-50 dark:bg-yellow-950/20"
          />
          <MetricCard
            icon={<Star className="w-6 h-6 text-purple-500" />}
            title="Average Rating"
            value={analytics?.averageRating?.toFixed(1) ?? '0.0'}
            subtitle={`${analytics?.reviewsCount ?? analytics?.reviews?.list?.length ?? 0} reviews`}
            loading={loading}
            color="bg-purple-50 dark:bg-purple-950/20"
          />
        </div>

        {/* Attendance Progress */}
        {analytics && analytics.totalRsvps > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Attendance Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold text-foreground">{analytics.attendanceRate}%</span>
                </div>
                <Progress value={analytics.attendanceRate} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-accent rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{analytics.totalRsvps}</p>
                  <p className="text-xs text-muted-foreground">RSVPs</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.totalAttendance}</p>
                  <p className="text-xs text-muted-foreground">Attended</p>
                </div>
                <div className="text-center p-4 bg-accent rounded-lg">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{analytics.totalRsvps - analytics.totalAttendance}</p>
                  <p className="text-xs text-muted-foreground">No-shows</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RSVP List */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              RSVPs ({filteredRsvps.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setRsvpFilter('WAITLISTED')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${rsvpFilter === 'WAITLISTED' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
              >
                Waitlisted
              </button>
              <button
                onClick={() => setRsvpFilter('CONFIRMED')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${rsvpFilter === 'CONFIRMED' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setRsvpFilter('ALL')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${rsvpFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
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
                <thead className="bg-accent">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Registered At</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRsvps.map((rsvp, index) => (
                    <tr key={rsvp.id} className="hover:bg-accent/50 transition-colors">
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
                              className="text-xs font-semibold px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRsvp(rsvp.id)}
                              className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                        {(rsvp.status === 'CONFIRMED' || rsvp.status === 'ATTENDING') && (
                          <button
                            onClick={() => handleRejectRsvp(rsvp.id)}
                            className="text-xs font-semibold px-2 py-1 text-red-600 hover:text-red-800 transition-colors"
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
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Credits & Attendance ({analytics?.attendanceList?.length || 0})
            </h3>
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
                <thead className="bg-accent">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Session</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Credits</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.attendanceList.map((record: any) => (
                    <tr key={record.id} className="hover:bg-accent/50 transition-colors">
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
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Student Reviews ({analytics?.reviews?.list?.length ?? analytics?.reviewsCount ?? 0})
            </h3>
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
                <div key={review.id} className="border border-border rounded-lg p-4 bg-accent/20">
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
  color: string;
}

function MetricCard({ icon, title, value, subtitle, loading, color }: MetricCardProps) {
  if (loading) {
    return (
      <div className={`${color} rounded-xl p-6 border border-border`}>
        <Skeleton className="h-6 w-6 mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={`${color} rounded-xl p-6 border border-border`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
