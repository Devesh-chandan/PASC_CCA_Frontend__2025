"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  BadgeCheck,
  Clock,
  Star,
  BookOpen,
  Award,
  Calendar,
  MapPin,
  TrendingUp,
  Trophy
} from "lucide-react";
import { ProfileCard } from "../../../../components/profile/ProfileCard";
import { StatCard } from "../../../../components/profile/StatCard";
import { ProgressStatCard } from "../../../../components/profile/ProgressStatCard";
import { useAuthStore } from "@/lib/store";
import { Department } from "@/types/auth";
import axios from "axios";
import { UserAttendanceStats } from "@/types/attendance";
import { apiUrl, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dummy data for zustand user
const dummyUser = {
  id: 1,
  name: "Jane Smith",
  email: "janesmith@example.com",
  password: "password123",
  department: Department.IT,
  year: 2,
  passoutYear: 2025,
  roll: 21045,
  hours: 18,
};

function useDashboardData(dummyDashboardData: UserAttendanceStats) {
  const [dashboardData, setDashboardData] = useState<UserAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiUrl}/attendance/user-attendance-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Attendance stats:', response.data);
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setDashboardData(dummyDashboardData);
        setLoading(false);
      }
    }
    getData();
  }, []);

  return { dashboardData, loading };
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Dummy dashboard data matching UserAttendanceStats
  const dummyDashboardData: UserAttendanceStats = {
    sessionsAttended: 0,
    sessions: [],
    totalCredits: 0,
    completionRate: 0,
    userPersonalBest: {
      sessionId: 0,
      userId: 0,
      credits: 0,
    },
  };

  const userStore = useAuthStore((state) => state.user);

  // Map the zustand user to the UI User type
  const user = userStore
    ? {
      name: userStore.name || "",
      email: userStore.email,
      department: userStore.department,
      passOutYear: userStore.passoutYear?.toString() || "",
      rollNo: userStore.roll?.toString() || "",
      year: userStore.year?.toString() || "",
    }
    : undefined;

  // Use custom hook for dashboard data
  const { dashboardData, loading } = useDashboardData(dummyDashboardData);
  const stats = dashboardData || dummyDashboardData;

  // Generate activities from actual attended sessions
  const recentActivities = stats.sessions.slice(0, 5).map((session) => ({
    icon: <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />,
    title: `Attended ${session.sessionName}`,
    date: session.startTime
      ? new Date(session.startTime.toString()).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    credits: session.credits,
  }));

  return (
    <main className="bg-[var(--color-surface)] min-h-screen p-2 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            className="flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            onClick={() => router.push('/student/dashboard')}
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[var(--color-card)] rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "overview"
                  ? "border-blue-600 text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "attendance"
                  ? "border-blue-600 text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance History
                </div>
              </button>
              <button
                onClick={() => setActiveTab("achievements")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "achievements"
                  ? "border-blue-600 text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Achievements
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Just Profile Info - Simple and Clean */}
                <div className="max-w-2xl mx-auto">
                  {user ? (
                    <ProfileCard user={user} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <span className="text-[var(--color-text-muted)]">No user data available.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATTENDANCE HISTORY TAB */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[var(--color-text-muted)] mb-1">Total Credits</p>
                          <p className="text-3xl font-bold text-[var(--color-primary)]">{stats.totalCredits}</p>
                        </div>
                        <Award className="w-12 h-12 text-[var(--color-info-light)] opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[var(--color-text-muted)] mb-1">Sessions</p>
                          <p className="text-3xl font-bold text-green-600">{stats.sessionsAttended}</p>
                        </div>
                        <Calendar className="w-12 h-12 text-green-400 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[var(--color-text-muted)] mb-1">Completion</p>
                          <p className="text-3xl font-bold text-purple-600">{Math.floor(stats.completionRate)}%</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-400 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All Attended Sessions */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">All Attended Sessions</CardTitle>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {stats.sessions.length === 0
                        ? 'No sessions attended yet'
                        : `Complete history of ${stats.sessions.length} attended session${stats.sessions.length !== 1 ? 's' : ''}`}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-24 bg-[var(--color-surface-hover)] rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : stats.sessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4" />
                        <p className="text-[var(--color-text-muted)] mb-2">No sessions attended yet</p>
                        <p className="text-sm text-[var(--color-text-muted)]">Start attending events to earn credits!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-all bg-[var(--color-card)] hover:border-[var(--color-info)]/40"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
                                  {session.sessionName}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    ✓ Attended
                                  </Badge>
                                  <Badge className="bg-[var(--color-profile-icon-bg)] text-[var(--color-primary)] hover:bg-[var(--color-profile-icon-bg-hover)]">
                                    {session.credits} {session.credits === 1 ? 'Credit' : 'Credits'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[var(--color-text-muted)]">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span>{session.startTime ? formatDate(session.startTime) : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span>
                                  {session.startTime && new Date(session.startTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {session.endTime &&
                                    ` - ${new Date(session.endTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className="space-y-6">
                {/* Personal Best */}
                {stats.userPersonalBest.credits > 0 ? (
                  <Card className="border-none shadow-md bg-gradient-to-r from-yellow-50 to-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-700">
                        <Trophy className="w-6 h-6" />
                        Personal Best Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[var(--color-text-muted)] mb-2">Highest credits earned in a single session</p>
                          <p className="text-4xl font-bold text-orange-600 mb-2">
                            {stats.userPersonalBest.credits} credits
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            From: {stats.sessions.find(s => s.id === stats.userPersonalBest.sessionId)?.sessionName || 'Unknown Session'}
                          </p>
                        </div>
                        <Award className="w-20 h-20 text-orange-400 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-none shadow-sm">
                    <CardContent className="pt-6 text-center py-12">
                      <Trophy className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4" />
                      <p className="text-[var(--color-text-muted)]">No achievements yet</p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">Attend sessions to unlock achievements!</p>
                    </CardContent>
                  </Card>
                )}

                {/* Badges Showcase (LeetCode Style) */}
                <Card className="border-none shadow-sm bg-[var(--color-card)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Earned Badges</span>
                      <span className="text-2xl font-bold">{
                        [
                          stats.sessionsAttended >= 1,
                          stats.totalCredits >= 5,
                          stats.sessionsAttended >= 5,
                          stats.totalCredits >= 20,
                          stats.totalCredits >= 50
                        ].filter(Boolean).length
                      }</span>
                    </CardTitle>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Your most recently unlocked achievements</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center min-h-[100px]">
                      {(() => {
                        const allBadges = [
                          { title: "First Steps", icon: "/first-steps.png", unlocked: stats.sessionsAttended >= 1 },
                          { title: "Getting Started", icon: "/getting-started.png", unlocked: stats.totalCredits >= 5 },
                          { title: "Dedicated Learner", icon: "/dedicated-learner.png", unlocked: stats.sessionsAttended >= 5 },
                          { title: "Credit Collector", icon: "/credit-collector.png", unlocked: stats.totalCredits >= 20 },
                          { title: "Credit Master", icon: "/credit-master.png", unlocked: stats.totalCredits >= 50 },
                        ];
                        const unlocked = allBadges.filter(b => b.unlocked).reverse();

                        if (unlocked.length === 0) {
                          return (
                            <div className="w-full py-6 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                              <Star className="w-8 h-8 opacity-20 mb-2" />
                              <p className="text-sm">No badges earned yet</p>
                            </div>
                          );
                        }

                        return unlocked.map((badge, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-[80px] h-[80px] md:w-[90px] md:h-[90px] relative transition-transform group-hover:scale-110 drop-shadow-md">
                              <img
                                src={badge.icon}
                                alt={badge.title}
                                className="w-full h-full object-contain"
                              />
                              {idx === 0 && (
                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-yellow-400">NEW</span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] text-center max-w-[90px] truncate">{badge.title}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* All Milestones */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>All Milestones Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-[var(--color-border-light)]">
                      {[
                        {
                          id: 1,
                          title: "First Steps",
                          description: "Attend your first session",
                          icon: "/first-steps.png",
                          isUnlocked: stats.sessionsAttended >= 1,
                          current: stats.sessionsAttended,
                          target: 1,
                          unit: "sessions"
                        },
                        {
                          id: 2,
                          title: "Getting Started",
                          description: "Earn 5 academic credits",
                          icon: "/getting-started.png",
                          isUnlocked: stats.totalCredits >= 5,
                          current: stats.totalCredits,
                          target: 5,
                          unit: "credits"
                        },
                        {
                          id: 3,
                          title: "Dedicated Learner",
                          description: "Attend 5 active sessions",
                          icon: "/dedicated-learner.png",
                          isUnlocked: stats.sessionsAttended >= 5,
                          current: stats.sessionsAttended,
                          target: 5,
                          unit: "sessions"
                        },
                        {
                          id: 4,
                          title: "Credit Collector",
                          description: "Accumulate 20 total credits",
                          icon: "/credit-collector.png",
                          isUnlocked: stats.totalCredits >= 20,
                          current: stats.totalCredits,
                          target: 20,
                          unit: "credits"
                        },
                        {
                          id: 5,
                          title: "Credit Master",
                          description: "Accumulate 50 total credits",
                          icon: "/credit-master.png",
                          isUnlocked: stats.totalCredits >= 50,
                          current: stats.totalCredits,
                          target: 50,
                          unit: "credits"
                        }
                      ].map((badge) => (
                        <div key={badge.id} className={`flex items-center gap-4 py-4 rounded-lg px-2 transition-colors ${badge.isUnlocked ? 'bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]/80' : 'bg-transparent'}`}>
                          <div className={`relative w-[50px] h-[50px] flex-shrink-0 flex items-center justify-center filter ${badge.isUnlocked ? 'drop-shadow-sm' : 'grayscale opacity-50'}`}>
                            <img
                              src={badge.icon}
                              alt={badge.title}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-bold tracking-tight ${badge.isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{badge.title}</h4>
                              <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                                {Math.min(badge.current, badge.target)} / {badge.target} {badge.unit}
                              </span>
                            </div>
                            <p className="text-[13px] text-[var(--color-text-muted)] mb-2 truncate">{badge.description}</p>

                            <div className="w-full bg-[var(--color-border-light)] rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${badge.isUnlocked ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                                style={{ width: `${Math.min((badge.current / badge.target) * 100, 100)}%` }}
                              />
                            </div>
                          </div>

                          {badge.isUnlocked && (
                            <div className="flex-shrink-0 ml-2">
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-2 py-0.5 pointer-events-none">
                                Unlocked
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
