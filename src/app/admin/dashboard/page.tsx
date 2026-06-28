"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  BarChart3,
  Megaphone,
  Plus,
  CheckCircle,
  UserCheck,
  TrendingUp,
  Activity,
  Star,
  Award,
  RefreshCw,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { analyticsAPI } from "@/lib/api";
import { DashboardAnalytics } from "@/types/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

// ─── Mapper ────────────────────────────────────────────────────────────────

function mapDashboardAnalytics(apiData: any): DashboardAnalytics {
  return {
    totalEvents: apiData.overview.totalEvents,
    totalUsers: apiData.overview.totalUsers,
    totalRsvps: apiData.overview.totalRSVPs,
    totalAttendance: apiData.overview.totalAttendances,
    totalCreditsDistributed: 0,
    averageEventRating: apiData.overview.averageEventRating ?? 0,

    upcomingEvents: apiData.eventsByStatus?.UPCOMING ?? 0,
    ongoingEvents: apiData.eventsByStatus?.ONGOING ?? 0,
    completedEvents: apiData.eventsByStatus?.COMPLETED ?? 0,

    topEvents: (apiData.topEvents ?? []).slice(0, 5).map((e: any) => ({
      id: e.id,
      title: e.title,
      attendanceCount: e.totalAttendance,
      rating: e.rating ?? 0,
    })),

    recentActivity: (apiData.recentEvents ?? []).slice(0, 5).map((e: any) => ({
      type: "EVENT",
      description: `${e.title} (${e.status})`,
      timestamp: e.startDate,
    })),
  };
}

/* ─── Donut Chart (SVG) ────────────── */
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 180,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  const [hoveredSegment, setHoveredSegment] = useState<DonutSegment | null>(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 75;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 drop-shadow-sm transition-all duration-300">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-surface-hover)" strokeWidth={strokeWidth} className="opacity-40" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((seg, i) => {
              const pct = seg.value / total;
              const dashLength = pct * circumference;
              const dashGap = circumference - dashLength;
              const offset = cumulativeOffset;
              cumulativeOffset += dashLength;
              return (
                <circle
                  key={i}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${dashGap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer drop-shadow-md"
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
      </svg>
      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 pointer-events-none">
        {hoveredSegment ? (
          <>
            <span className="text-2xl font-bold tracking-tight drop-shadow-sm transition-colors" style={{ color: hoveredSegment.color }}>
              {hoveredSegment.value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 transition-colors" style={{ color: hoveredSegment.color }}>
              {hoveredSegment.label}
            </span>
          </>
        ) : (
          <>
            {centerValue && (
              <span className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight drop-shadow-sm">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">{centerLabel}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MetricCard ────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  loading: boolean;
  color: string;
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  loading,
  color,
}: MetricCardProps) {
  const baseCardClass = "rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center";

  if (loading) {
    return (
      <div className={`${color} ${baseCardClass}`}>
        <Skeleton className="h-6 w-6 mb-3" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={`${color} ${baseCardClass}`}>
      <div className="flex flex-row items-center justify-between w-full mb-3 sm:mb-4">
        <span className="text-sm sm:text-base font-medium text-[var(--color-text-muted)]">{title}</span>
        {icon}
      </div>
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">{value}</div>
      {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-2">{subtitle}</p>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsAPI.getAdminDashboard();
      console.log("RAW API DATA 👉", res.data?.data);
      if (res.data?.success && res.data.data) {
        setAnalytics(mapDashboardAnalytics(res.data.data));
      } else {
        throw new Error("Invalid analytics response");
      }
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError("Failed to fetch analytics data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const attendanceRate = (analytics as any)?.overview?.attendanceRate ?? 0;

  const activeEventsCount = (analytics?.upcomingEvents ?? 0) + (analytics?.ongoingEvents ?? 0);
  const totalPipelineEvents = (analytics?.upcomingEvents ?? 0) + (analytics?.ongoingEvents ?? 0) + (analytics?.completedEvents ?? 0);

  const eventPipelineSegments: DonutSegment[] = analytics
    ? [
      { label: 'Total', value: totalPipelineEvents, color: '#64748b' }, // slate-500
      { label: 'Active', value: activeEventsCount, color: '#0ea5e9' }, // sky-500
      { label: 'Ongoing', value: analytics.ongoingEvents, color: '#10b981' }, // emerald-500
      { label: 'Upcoming', value: analytics.upcomingEvents, color: '#3b82f6' }, // blue-500
      { label: 'Completed', value: analytics.completedEvents, color: '#9333ea' }, // purple-600
    ]
    : [];

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
                  Admin Dashboard
                </h1>
                <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
                  Comprehensive insights into CCA activities
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center mt-3 sm:mt-0">
              <button
                onClick={fetchAnalytics}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 hover:border-[var(--color-primary)]/50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </button>

              <button
                onClick={() => router.push("/admin/createEvent")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-transparent bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </div>
          </div>
        </header>

        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={analytics?.totalEvents ?? 0}
            Icon={Calendar}
          />
          <StatsCard
            title="Total Students"
            value={analytics?.totalUsers ?? 0}
            Icon={Users}
          />
          <StatsCard
            title="Total RSVPs"
            value={analytics?.totalRsvps ?? 0}
            Icon={UserCheck}
          />
          <StatsCard
            title="Total Attendances"
            value={analytics?.totalAttendance ?? 0}
            Icon={CheckCircle}
          />
        </div>

        {/* ── Event Status Pipeline ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Panel */}
          <div className="lg:col-span-1 rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
            <div className="w-full flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)] tracking-tight">Event Distribution</h3>
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0 hidden sm:flex">
                <Activity className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
            </div>

            <div className="flex-1 flex flex-row items-center justify-between w-full mt-1.5">
              {/* Left: Chart Visualization */}
              <div className="flex-shrink-0 flex items-center justify-center w-[105px] sm:w-[110px]">
                <DonutChart
                  segments={eventPipelineSegments}
                  centerValue={totalPipelineEvents.toString()}
                  centerLabel="Total Events"
                  size={110}
                />
              </div>

              {/* Right: Legend Items */}
              <div className="flex flex-col flex-1 justify-center gap-1 pl-4 sm:pl-5">
                {eventPipelineSegments.filter(s => s.value >= 0).map((seg) => {
                  const percentage = totalPipelineEvents > 0 ? Math.round((seg.value / totalPipelineEvents) * 100) : 0;
                  return (
                    <div key={seg.label} className="grid grid-cols-[1fr_auto_40px] items-center gap-3 py-1 group border-b border-[var(--color-border-light)]/20 last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-[var(--color-text-muted)] text-[13px] sm:text-sm font-semibold group-hover:text-[var(--color-text-primary)] transition-colors truncate">
                          {seg.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-hover)]/60 px-2 py-0.5 rounded-full border border-[var(--color-border-light)]/30 min-w-[44px] text-center tabular-nums">
                        {percentage}%
                      </span>
                      <span className="text-right text-[13px] sm:text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                        {seg.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Metrics Tiles layout block (2x2 grid) */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-3 h-full">
            <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-muted)]">Ongoing</h3>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                {analytics?.ongoingEvents ?? 0}
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-muted)]">Upcoming</h3>
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                {analytics?.upcomingEvents ?? 0}
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-muted)]">Completed</h3>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                {analytics?.completedEvents ?? 0}
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[var(--color-text-muted)]">Active</h3>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                {activeEventsCount}
              </p>
            </div>
          </div>
        </div>

        {/* ── Engagement Highlights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1">
                  Average Rating
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    {(analytics?.averageEventRating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">/ 5.0</span>
                </div>
                {/* Visual Stars */}
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isFilled = starIdx <= Math.round(analytics?.averageEventRating ?? 0);
                    return (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          isFilled
                            ? "text-amber-500 fill-amber-500"
                            : "text-[var(--color-border)] fill-transparent"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              </div>
            </div>
          </div>

          {/* Credits Distributed */}
          <div className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1">
                  Credits Distributed
                </p>
                <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {analytics?.totalCreditsDistributed ?? 0}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Top Performing Events (Span 2) ── */}
          <div className="lg:col-span-2 flex flex-col h-full rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Top Performing Events</h3>
            </div>

            {analytics?.topEvents && analytics.topEvents.length > 0 ? (
              <div className="space-y-3">
                {analytics.topEvents.map((event: any, index: number) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_14px_rgba(15,23,42,0.1)] transition-[background-color,box-shadow]"
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold border transition-all ${index === 0
                        ? 'bg-[#ffe44d] border-[#e6be00] text-[#8a7200]' // 1st (Solid Gold Base)
                        : index === 1
                          ? 'bg-[#e2e8f0] border-[#cbd5e1] text-[#475569]' // 2nd (Solid Silver/Slate)
                          : index === 2
                            ? 'bg-[#ffedd5] border-[#fdba74] text-[#9a3412]' // 3rd (Solid Bronze)
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] opacity-80' // Others (Subdued)
                        }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[15px] sm:text-base font-bold text-[var(--color-text-primary)] truncate leading-tight" title={event.title}>
                          {event.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[13px] sm:text-sm font-semibold text-[var(--color-text-muted)]">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {event.attendanceCount} Attendees
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        <span className="font-semibold text-orange-700 dark:text-orange-400 text-sm leading-none">
                          {event.rating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                No event data available
              </div>
            )}
          </div>

          {/* ── Recent Activity (Span 1) ── */}
          <div className="lg:col-span-1 flex flex-col h-full rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Recent Activity</h3>
            </div>

            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              <div className="relative border-l border-[var(--color-border-light)] ml-2.5 pl-0 py-1 space-y-5">
                {analytics.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="relative pl-6 group">
                    {/* Timeline Dot on the line */}
                    <span className="absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-[4px] ring-[var(--color-card)] transition-transform group-hover:scale-125 duration-200" />
                    <div className="p-3.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)]/60 hover:border-[var(--color-primary)]/20 transition-all shadow-[0_2px_6px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2" title={activity.description}>
                        {activity.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1.5">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                No recent activity
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
