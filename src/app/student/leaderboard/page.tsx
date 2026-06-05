'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp, Info, ChevronDown, Users, Star, ArrowUp, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { leaderboardAPI } from '@/lib/api';
import { LeaderboardEntry, LeaderboardPeriod } from '@/types/leaderboard';
import { Skeleton } from '@/components/ui/skeleton';
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

const periods: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'WEEKLY', label: 'This Week' },
  { value: 'MONTHLY', label: 'This Month' },
  { value: 'SEMESTER', label: 'Semester' },
  { value: 'YEARLY', label: 'This Year' },
  { value: 'ALL_TIME', label: 'All Time' },
];

const TOTAL_DIVISIONS = 13;

type LeaderboardScope = 'global' | 'division';

interface MyDivisionInfo {
  isFirstYear: boolean;
  division: number | null;
  year: number;
  roll: number | null;
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [selectedDivision, setSelectedDivision] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('SEMESTER');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myInfo, setMyInfo] = useState<MyDivisionInfo | null>(null);
  const [myInfoLoading, setMyInfoLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchMyInfo = async () => {
      setMyInfoLoading(true);
      try {
        const res = await leaderboardAPI.getMyDivision();
        if (res.data?.success && res.data.data) {
          const info = res.data.data as MyDivisionInfo;
          setMyInfo(info);
          if (info.isFirstYear && info.division != null) {
            setSelectedDivision(info.division);
          }
        }
      } catch {
        // Not logged in or error - myInfo stays null
      } finally {
        setMyInfoLoading(false);
      }
    };
    fetchMyInfo();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, scope, selectedDivision]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const divisionParam = scope === 'division' ? selectedDivision : undefined;
      const response = await leaderboardAPI.get({
        period: selectedPeriod,
        division: divisionParam,
        limit: 50,
      });
      if (response.data?.success && response.data.data) {
        const data = response.data.data as LeaderboardEntry[];
        setLeaderboard(data);
        setCurrentPage(1);
        const userId = parseInt(localStorage.getItem('userId') || '0');
        const userEntry = data.find((entry) => entry.userId === userId);
        setUserRank(userEntry || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0') : 0;
  const isCurrentUserFirstYear = myInfo?.isFirstYear ?? false;

  const shouldHighlightUser = (entry: LeaderboardEntry) => {
    if (entry.userId !== currentUserId) return false;
    if (scope === 'global') return true;
    return isCurrentUserFirstYear;
  };

  const showMyRankCard = scope === 'division' && isCurrentUserFirstYear && userRank != null;
  const showDivisionBanner = scope === 'division' && !myInfoLoading && !isCurrentUserFirstYear;

  const top3 = !loading && leaderboard.length >= 3 ? leaderboard.slice(0, 3) : null;
  const restOfList = !loading ? (leaderboard.length >= 3 ? leaderboard.slice(3) : leaderboard) : [];

  const listToPaginate = top3 ? restOfList : leaderboard;
  const totalPages = Math.ceil(listToPaginate.length / PAGE_SIZE);
  const paginatedList = listToPaginate.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const startIndex = top3 
    ? (listToPaginate.length > 0 ? 3 + (currentPage - 1) * PAGE_SIZE + 1 : 0)
    : (listToPaginate.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0);

  const endIndex = top3
    ? Math.min(3 + currentPage * PAGE_SIZE, leaderboard.length)
    : Math.min(currentPage * PAGE_SIZE, leaderboard.length);

  /* Medal colors */
  const medalStyles = [
    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
    { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">

        {/* ─── Header ─── */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col gap-6">
            {/* Row 1: Title */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Leaderboard</h1>
                <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-0.5">Compete with your peers and climb the ranks</p>
              </div>
            </div>

            {/* Row 2: Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* Left side: Period pills */}
              <div className="grid grid-cols-5 gap-1 xl:flex xl:items-center justify-start xl:gap-1.5 bg-[var(--color-surface)]/50 p-1.5 rounded-xl border border-[var(--color-border-light)] w-full xl:w-auto mb-1">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`text-center px-1 py-2 sm:px-4 rounded-lg text-[10px] xs:text-[11px] sm:text-sm font-semibold tracking-[0.01em] transition-all ${selectedPeriod === period.value
                      ? 'bg-[var(--color-button-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Right side: Scope toggle + Division picker */}
              <div className="grid grid-cols-3 items-center gap-1.5 sm:gap-2.5 w-full xl:w-auto">
                {/* Scope Toggles grouped in 2/3 of the space */}
                <div className="col-span-2 grid grid-cols-2 rounded-xl bg-[var(--color-surface)] p-1 border border-[var(--color-border-light)] relative">
                  <button
                    type="button"
                    onClick={() => setScope('global')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-4 text-[12px] sm:text-sm font-semibold rounded-lg transition-all ${scope === 'global'
                      ? 'bg-[var(--color-button-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    <Users className="w-3.5 h-3.5 hidden sm:block" />
                    Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('division')}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-4 text-[12px] sm:text-sm font-semibold rounded-lg transition-all ${scope === 'division'
                      ? 'bg-[var(--color-button-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                  >
                    <Star className="w-3.5 h-3.5 hidden sm:block" />
                    Division
                  </button>
                </div>

                {/* Division Select in 1/3 of the space */}
                <div className={`col-span-1 transition-all duration-300 ${scope === 'division' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <div className="relative">
                    <select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(Number(e.target.value))}
                      tabIndex={scope === 'global' ? -1 : 0}
                      className="appearance-none h-[38px] sm:h-[42px] w-full pl-2 sm:pl-3.5 pr-6 sm:pr-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] text-[12px] sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] cursor-pointer"
                    >
                      {Array.from({ length: TOTAL_DIVISIONS }, (_, i) => i + 1).map((div) => (
                        <option key={div} value={div}>Div {div}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Division banner for non-first-year */}
        {showDivisionBanner && (
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 bg-[var(--color-surface)]/60 border border-[var(--color-border-light)] rounded-2xl p-4 sm:p-5 mt-2">
            <div className="flex items-center gap-2 sm:gap-0 sm:pt-0.5">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[var(--color-info)]" />
              <p className="sm:hidden font-bold text-[13px] text-[var(--color-text-primary)]">Division Leaderboard</p>
            </div>
            <div className="text-[13px] sm:text-sm leading-relaxed sm:leading-relaxed space-y-1.5">
              <p className="hidden sm:block font-bold text-[var(--color-text-primary)]">Division Leaderboard &mdash; First-Year Students Only</p>
              <p className="text-[12px] sm:text-[13px] text-[var(--color-text-muted)]">
                The division leaderboard ranks <strong>first-year</strong> students by credits within their division.
                As a Year {myInfo?.year} student, you are not ranked here &mdash; this is view-only for you.
              </p>
            </div>
          </div>
        )}

        {/* ─── Your Rank Card ─── */}
        {scope === 'global' && userRank && (
          <div className="relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-[var(--color-surface)] border border-[var(--color-primary)]/20 p-5 sm:p-7 shadow-sm transition-all duration-300">
            {/* Background elements for flair */}
            <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
              <Trophy className="w-32 h-32 sm:w-48 sm:h-48 transform rotate-12 text-[var(--color-primary)]" />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.25rem] bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] flex items-center gap-1.5">
                    Your Global Rank {userRank.rank <= 3 && <Crown className="w-4 h-4 text-amber-500" />}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">#{userRank.rank}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center bg-[var(--color-card)] rounded-2xl p-4 sm:px-6 sm:py-4 border border-[var(--color-border)] justify-between sm:justify-start w-full sm:w-auto shadow-sm">
                <div className="text-center sm:text-right px-2 sm:px-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{userRank.credits}</p>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5 sm:mt-0">Credits</p>
                </div>
                <div className="w-px h-8 sm:h-10 bg-[var(--color-border)] mx-4 sm:mx-6" />
                <div className="text-center sm:text-right px-2 sm:px-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{userRank.eventsAttended}</p>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5 sm:mt-0">Events</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showMyRankCard && userRank && (
          <div className="relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-[var(--color-surface)] border border-[var(--color-primary)]/20 p-5 sm:p-7 shadow-sm transition-all duration-300">
            {/* Background elements for flair */}
            <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
              <Star className="w-32 h-32 sm:w-48 sm:h-48 transform rotate-12 text-[var(--color-primary)]" />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.25rem] bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] flex items-center gap-1.5">
                    Your Rank &middot; Division {selectedDivision} {userRank.rank <= 3 && <Crown className="w-4 h-4 text-amber-500" />}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">#{userRank.rank}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center bg-[var(--color-card)] rounded-2xl p-4 sm:px-6 sm:py-4 border border-[var(--color-border)] justify-between sm:justify-start w-full sm:w-auto shadow-sm">
                <div className="text-center sm:text-right px-2 sm:px-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{userRank.credits}</p>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5 sm:mt-0">Credits</p>
                </div>
                <div className="w-px h-8 sm:h-10 bg-[var(--color-border)] mx-4 sm:mx-6" />
                <div className="text-center sm:text-right px-2 sm:px-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{userRank.eventsAttended}</p>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5 sm:mt-0">Events</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Top 3 Podium ─── */}
        {top3 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 overflow-hidden">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-12 items-end px-1 sm:px-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="rounded-full bg-gradient-to-br from-slate-600 to-slate-200 p-[3px] shadow-md">
                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-[3px] border-[var(--color-card)]">
                      <AvatarFallback className="bg-[var(--color-podium-avatar-bg)] text-[var(--color-podium-avatar-icon)] flex items-center justify-center">
                        <User className="w-[55%] h-[55%] stroke-[2.5]" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="text-center space-y-1 mt-1">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate max-w-[110px] md:max-w-[140px]" title={top3[1].userName || 'User'}>{top3[1].userName || 'User'}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{top3[1].department}</p>
                  <div className="pt-1">
                    <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{top3[1].credits}</p>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">credits</p>
                  </div>
                </div>
                <div className="w-full mt-5 h-20 md:h-28 rounded-t-2xl bg-gradient-to-t from-[var(--color-podium-2)] to-[var(--color-podium-2)]/40 border-t-[3px] border-slate-400 shadow-[0_-4px_20px_rgba(148,163,184,0.15)] dark:shadow-[0_-4px_20px_rgba(148,163,184,0.05)] relative overflow-hidden flex flex-col justify-end items-center pb-2">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-100/30 to-transparent dark:from-slate-700/30" />
                  <span className="text-4xl md:text-5xl font-black text-slate-400/60 dark:text-slate-500/80 drop-shadow-sm">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 text-amber-500 mb-2 drop-shadow-md" />
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="rounded-full bg-gradient-to-br from-amber-600 to-amber-200 p-[4px] shadow-xl">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 border-[4px] border-[var(--color-card)]">
                      <AvatarFallback className="bg-[var(--color-podium-avatar-bg)] text-[var(--color-podium-avatar-icon)] flex items-center justify-center">
                        <User className="w-[55%] h-[55%] stroke-[2.5]" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="text-center space-y-1 mt-1">
                  <p className="font-bold text-base md:text-lg text-[var(--color-text-primary)] truncate max-w-[120px] md:max-w-[160px]" title={top3[0].userName || 'User'}>{top3[0].userName || 'User'}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{top3[0].department}</p>
                  <div className="pt-1">
                    <p className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">{top3[0].credits}</p>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">credits</p>
                  </div>
                </div>
                <div className="w-full mt-5 h-28 md:h-36 rounded-t-2xl bg-gradient-to-t from-[var(--color-podium-1)] to-[var(--color-podium-1)]/40 border-t-[3px] border-amber-400 shadow-[0_-4px_24px_rgba(251,191,36,0.15)] dark:shadow-[0_-4px_24px_rgba(251,191,36,0.05)] relative overflow-hidden flex flex-col justify-end items-center pb-2">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5" />
                  <span className="text-5xl md:text-6xl font-black text-amber-500/60 dark:text-amber-500/80 drop-shadow-sm">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="rounded-full bg-gradient-to-br from-orange-600 to-orange-200 p-[3px] shadow-md">
                    <Avatar className="w-14 h-14 md:w-18 md:h-18 border-[3px] border-[var(--color-card)]">
                      <AvatarFallback className="bg-[var(--color-podium-avatar-bg)] text-[var(--color-podium-avatar-icon)] flex items-center justify-center">
                        <User className="w-[55%] h-[55%] stroke-[2.5]" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="text-center space-y-1 mt-1">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate max-w-[110px] md:max-w-[140px]" title={top3[2].userName || 'User'}>{top3[2].userName || 'User'}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{top3[2].department}</p>
                  <div className="pt-1">
                    <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{top3[2].credits}</p>
                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">credits</p>
                  </div>
                </div>
                <div className="w-full mt-5 h-16 md:h-20 rounded-t-2xl bg-gradient-to-t from-[var(--color-podium-3)] to-[var(--color-podium-3)]/40 border-t-[3px] border-orange-400 shadow-[0_-4px_16px_rgba(249,115,22,0.15)] dark:shadow-[0_-4px_16px_rgba(249,115,22,0.05)] relative overflow-hidden flex flex-col justify-end items-center pb-2">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent dark:from-white/5" />
                  <span className="text-4xl md:text-5xl font-black text-orange-400/60 dark:text-orange-500/80 drop-shadow-sm">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Division subtitle */}
        {scope === 'division' && !loading && (
          <div className="flex flex-row items-center justify-between gap-2 mt-6 mb-3 px-1 sm:px-0">
            <p className="text-[12px] sm:text-sm text-[var(--color-text-muted)] leading-relaxed truncate pr-2">
              Showing <span className="font-semibold text-[var(--color-text-primary)]">Division {selectedDivision}</span> &mdash; first-year students only
            </p>
            <span className="shrink-0 text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface)]/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-[var(--color-border-light)] shadow-sm">
              {leaderboard.length} student{leaderboard.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* ─── Rankings Table ─── */}
        <div className="bg-transparent overflow-visible">
          {/* Table Header */}
          <div className={`grid ${scope === 'global' ? 'grid-cols-[3rem_1fr_auto_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5rem_5.5rem_5.5rem]' : 'grid-cols-[3rem_1fr_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5.5rem_5.5rem]'} items-center gap-3 px-5 md:px-6 py-3.5 mb-2`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Rank</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Student</span>
            <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Department</span>
            {scope === 'global' && <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Year</span>}
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Events</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-center">Credits</span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`grid ${scope === 'global' ? 'grid-cols-[3rem_1fr_auto_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5rem_5.5rem_5.5rem]' : 'grid-cols-[3rem_1fr_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5.5rem_5.5rem]'} items-center gap-3 px-5 md:px-6 py-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)]/35`}>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="hidden md:block h-3.5 w-16" />
                  {scope === 'global' && <Skeleton className="hidden md:block h-3.5 w-10" />}
                  <Skeleton className="h-3.5 w-8 ml-auto" />
                  <Skeleton className="h-3.5 w-12 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && leaderboard.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-profile-icon-bg)] flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">No Rankings Yet</p>
              <p className="text-sm text-[var(--color-text-muted)] text-center max-w-xs">
                {scope === 'division'
                  ? `No first-year students found in Division ${selectedDivision} for this period.`
                  : 'No data available for this period.'}
              </p>
            </div>
          )}

          {/* Data Rows */}
          {!loading && leaderboard.length > 0 && (
            <div className="space-y-3">
              {paginatedList.map((entry, index) => {
                const isHighlighted = shouldHighlightUser(entry);
                return (
                  <div
                    key={`${entry.userId}-${index}`}
                    className={`group grid ${scope === 'global' ? 'grid-cols-[3rem_1fr_auto_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5rem_5.5rem_5.5rem]' : 'grid-cols-[3rem_1fr_auto_auto] md:grid-cols-[3.5rem_1fr_9rem_5.5rem_5.5rem]'} items-center gap-2 md:gap-3 px-3 md:px-6 py-3 md:py-4 rounded-xl border border-[var(--color-border-light)] shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_14px_rgba(15,23,42,0.1)] transition-[background-color,box-shadow,border-color] ${isHighlighted
                      ? 'bg-[var(--color-primary)]/5 border-l-[3px] border-l-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
                      : 'bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)] border-l-[3px] border-l-transparent'
                      }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      {entry.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full ${medalStyles[entry.rank - 1].bg} flex items-center justify-center`}>
                          {entry.rank === 1 ? (
                            <Crown className={`w-4 h-4 ${medalStyles[0].text}`} />
                          ) : (
                            <Medal className={`w-4 h-4 ${medalStyles[entry.rank - 1].text}`} />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-[var(--color-text-muted)] tabular-nums">{entry.rank}</span>
                      )}
                    </div>

                    {/* Student */}
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0 pr-1">
                      <Avatar className="w-9 h-9 md:w-10 md:h-10 shrink-0 border border-[var(--color-border-light)] shadow-sm">
                        <AvatarFallback className="text-xs font-semibold bg-[var(--color-surface-hover)]">{entry.userName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] md:text-base font-bold text-[var(--color-text-primary)] tracking-tight truncate">
                            {entry.userName || 'Anonymous'}
                          </p>
                          {isHighlighted && (
                            <span className="hidden xs:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-bold uppercase tracking-wide">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] md:hidden truncate">{entry.department}</p>
                      </div>
                    </div>

                    {/* Department */}
                    <span className="hidden md:block text-sm text-[var(--color-text-muted)] text-center">{entry.department}</span>

                    {/* Year */}
                    {scope === 'global' && (
                      <span className="hidden md:block text-sm text-[var(--color-text-muted)]">Year {entry.year}</span>
                    )}

                    {/* Events */}
                    <div className="flex justify-center pr-1 md:pr-0">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-[13px] font-bold sm:font-semibold text-emerald-600 dark:text-emerald-400">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="tabular-nums">{entry.eventsAttended}</span>
                      </span>
                    </div>

                    {/* Credits */}
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-[13px] font-bold sm:font-semibold text-[var(--color-primary)]">
                        <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="tabular-nums">{entry.credits}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total count footer */}
        {!loading && leaderboard.length > 0 && (
          <div className="space-y-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <p className="text-center text-xs text-[var(--color-text-muted)]">
              Showing {startIndex}–{endIndex} of {leaderboard.length} students
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
