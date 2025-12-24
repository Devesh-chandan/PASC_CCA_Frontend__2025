"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Award,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { analyticsAPI, leaderboardAPI } from '@/lib/api';
import { LeaderboardEntry } from '@/types/leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AnnouncementList } from '@/components/announcements/AnnouncementList';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalCredits: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
    completionRate: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user analytics
      const analyticsResponse = await analyticsAPI.getUserAnalytics();
      console.log('Analytics response:', analyticsResponse.data);
      if (analyticsResponse.data?.success && analyticsResponse.data.data) {
        const data = analyticsResponse.data.data as any;
        const overview = data.overview || {};
        setStats({
          totalCredits: overview.totalCredits || 0,
          eventsAttended: overview.eventsAttended || 0,
          upcomingEvents: data.upcomingEvents?.length || 0,
          completionRate: overview.attendanceRate || 0,
        });
      }

      // Fetch leaderboard
      const leaderboardResponse = await leaderboardAPI.get({ 
        period: 'SEMESTER', 
        limit: 5 
      });
      console.log('Leaderboard response:', leaderboardResponse.data);
      if (leaderboardResponse.data?.success && leaderboardResponse.data.data) {
        const leaders = leaderboardResponse.data.data as LeaderboardEntry[];
        setTopPerformers(leaders);
      }

      // Fetch user's rank separately
      try {
        const rankResponse = await leaderboardAPI.getMyRank();
        console.log('My rank response:', rankResponse.data);
        // getMyRank returns { success, data: { rank, totalUsers, credits } }
        if (rankResponse.data?.success && rankResponse.data.data) {
          const rankData = rankResponse.data.data;
          // Find user in leaderboard to get full entry
          const userId = parseInt(localStorage.getItem('userId') || '0');
          const userEntry = leaderboardResponse.data?.data?.find((l: LeaderboardEntry) => l.userId === userId);
          if (userEntry) {
            setUserRank(userEntry);
          } else if (rankData.rank > 0) {
            // Create a basic entry from rank data
            setUserRank({
              userId: userId,
              userName: 'You',
              department: 'IT',
              year: 1,
              credits: rankData.credits,
              eventsAttended: 0,
              rank: rankData.rank
            } as LeaderboardEntry);
          }
        }
      } catch (rankError) {
        console.log('Could not fetch user rank:', rankError);
        // Fallback: find in leaderboard
        const userId = parseInt(localStorage.getItem('userId') || '0');
        const userEntry = leaderboardResponse.data?.data?.find((l: LeaderboardEntry) => l.userId === userId);
        if (userEntry) {
          setUserRank(userEntry);
        }
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
      // Set default values even on error
      setStats({
        totalCredits: 0,
        eventsAttended: 0,
        upcomingEvents: 0,
        completionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your CCA progress and achievements
            </p>
          </div>
          <button
            onClick={() => router.push('/student/events')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Events
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Award className="w-6 h-6 text-yellow-500" />}
            title="Total Credits"
            value={stats.totalCredits.toString()}
            loading={loading}
            color="bg-yellow-50 dark:bg-yellow-950/20"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6 text-blue-500" />}
            title="Events Attended"
            value={stats.eventsAttended.toString()}
            loading={loading}
            color="bg-blue-50 dark:bg-blue-950/20"
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-green-500" />}
            title="Upcoming Events"
            value={stats.upcomingEvents.toString()}
            loading={loading}
            color="bg-green-50 dark:bg-green-950/20"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-purple-500" />}
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            loading={loading}
            color="bg-purple-50 dark:bg-purple-950/20"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Leaderboard & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Rank Card */}
            {userRank && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Your Rank</p>
                    <h2 className="text-4xl font-bold mt-1">#{userRank.rank}</h2>
                    <p className="text-blue-100 mt-2">
                      {userRank.credits} credits • {userRank.eventsAttended} events
                    </p>
                  </div>
                  <Trophy className="w-20 h-20 text-yellow-300" />
                </div>
                <div className="mt-4">
                  <Progress value={stats.completionRate} className="h-2" />
                  <p className="text-blue-100 text-sm mt-2">
                    {stats.completionRate}% towards your goal
                  </p>
                </div>
              </div>
            )}

            {/* Top Performers */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Top Performers</h3>
                </div>
                <button
                  onClick={() => router.push('/student/leaderboard')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </button>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-900'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {entry.user?.name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.user?.department} • Year {entry.user?.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{entry.credits}</p>
                        <p className="text-xs text-muted-foreground">credits</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/student/events')}
                  className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all text-left"
                >
                  <Calendar className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium">Browse Events</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Find upcoming events
                  </p>
                </button>
                <button
                  onClick={() => router.push('/student/profile')}
                  className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all text-left"
                >
                  <Award className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium">My Profile</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View stats & attendance
                  </p>
                </button>
                <button
                  onClick={() => router.push('/student/leaderboard')}
                  className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all text-left"
                >
                  <Trophy className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium">Leaderboard</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    See top performers
                  </p>
                </button>
                <button
                  onClick={() => router.push('/student/announcements')}
                  className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all text-left"
                >
                  <BarChart3 className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium">Announcements</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View all announcements
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Announcements */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-xl font-semibold mb-4">Announcements</h3>
              <AnnouncementList />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  loading: boolean;
  color: string;
}

function StatCard({ icon, title, value, loading, color }: StatCardProps) {
  if (loading) {
    return (
      <div className={`${color} rounded-xl p-6`}>
        <Skeleton className="h-6 w-6 mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <div className={`${color} rounded-xl p-6 border border-border`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-medium text-foreground">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

