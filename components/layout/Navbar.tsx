"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Sun, Moon, User, LayoutDashboard, Calendar, Trophy, Bell, Menu, X, LogIn, UserPlus, Megaphone } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { apiUrl } from "@/lib/utils";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const { clearAuth } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const admin = useAuthStore((state) => state.admin);

  // Determine if user is actually logged in.
  // We use localStorage as the source of truth so the Navbar stays consistent
  // even when the Zustand store hasn't been hydrated yet (e.g. when the user
  // navigates to the landing page "/" directly without going through AuthGuard).
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [effectiveRole, setEffectiveRole] = useState<"student" | "admin" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role") as "student" | "admin" | null;
    // Logged in if: there's a token AND (the Zustand store has user/admin data OR localStorage has a role)
    const loggedIn = !!(token && (user || admin || storedRole));
    setIsLoggedIn(loggedIn);
    // Role: prefer the live Zustand store value, fall back to localStorage
    setEffectiveRole(role ?? storedRole);
  }, [user, admin, role]);

  // Check if we're on the landing page or auth pages
  const isLandingPage = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");

  const clearAuthStorageAndCookies = () => {
    clearAuth();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    document.cookie =
      "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie =
      "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
        }/auth/user/logout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (e) {
      // ignore error
    }
    clearAuthStorageAndCookies();
    router.push("/auth/login");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  return (
    <nav className="w-full sticky top-0 z-50 bg-[var(--color-navbar)] border-b border-[var(--color-border)] transition-colors">
      <div className="flex justify-between items-center mx-auto px-5 py-3">
        {/* Logo */}
        <Link href={isLoggedIn ? (effectiveRole === "admin" ? "/admin/dashboard" : "/student/dashboard") : "/"} className="flex items-center cursor-pointer">
          <Image src="/logo.png" width={120} height={80} alt="logo" priority />
        </Link>

        {/* Navigation Links - Only show for logged in users */}
        {isLoggedIn && effectiveRole === "student" && (
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/student/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/student/dashboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/student/events"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/student/events")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>
            <Link
              href="/student/leaderboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/student/leaderboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
            <Link
              href="/student/announcements"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/student/announcements")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Bell className="w-4 h-4" />
              Announcements
            </Link>
          </div>
        )}

        {isLoggedIn && effectiveRole === "admin" && (
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/admin/dashboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/events"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/admin/events")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>
            <Link
              href="/admin/announcements"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive("/admin/announcements")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Megaphone className="w-4 h-4" />
              Announcements
            </Link>
          </div>
        )}

        {/* Right side icons */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button - only for logged in users */}
          {isLoggedIn && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-nav-hover-bg)] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[var(--color-text-secondary)]" />
              ) : (
                <Menu className="h-6 w-6 text-[var(--color-text-secondary)]" />
              )}
            </button>
          )}

          <ThemeSwitcher />

          {/* Notification Bell - show for both student and admin */}
          {isLoggedIn && <NotificationBell />}

          {/* Show Login/Signup for guests, Profile dropdown for logged in users */}
          {!isLoggedIn ? (
            // Guest view - Show Login and Sign Up buttons
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-nav-hover-bg)] rounded-lg transition-colors font-medium"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-button-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-button-primary-hover)] hover:shadow-lg hover:scale-105 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </div>
          ) : (
            // Logged in view - Show profile dropdown
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="bg-[var(--color-profile-icon-bg)] p-2 rounded-full cursor-pointer hover:bg-[var(--color-profile-icon-bg-hover)] transition-colors"
              >
                <User className="h-6 w-6 text-white" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[var(--color-card)] rounded-lg shadow-lg border border-[var(--color-border)] z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-[var(--color-nav-active-bg)] p-3 rounded-full">
                        <User className="h-6 w-6 text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--color-text-primary)]">{user?.name || admin?.name || 'User'}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{user?.email || admin?.email}</p>
                      </div>
                    </div>
                    {user && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">Department:</span>
                          <span className="font-medium text-[var(--color-text-primary)]">{user.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-muted)]">Year:</span>
                          <span className="font-medium text-[var(--color-text-primary)]">{user.year}</span>
                        </div>
                        {user.roll && (
                          <div className="flex justify-between">
                            <span className="text-[var(--color-text-muted)]">Roll No:</span>
                            <span className="font-medium text-[var(--color-text-primary)]">{user.roll}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push(effectiveRole === "admin" ? "/admin/dashboard" : "/student/dashboard");
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-nav-hover-bg)] transition-colors flex items-center gap-2 text-[var(--color-text-secondary)]"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isLoggedIn && effectiveRole === "student" && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex flex-col p-4 space-y-2">
            <Link
              href="/student/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/student/dashboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/student/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/student/events")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Calendar className="w-5 h-5" />
              Events
            </Link>
            <Link
              href="/student/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/student/leaderboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Trophy className="w-5 h-5" />
              Leaderboard
            </Link>
            <Link
              href="/student/announcements"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/student/announcements")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Bell className="w-5 h-5" />
              Announcements
            </Link>
          </div>
        </div>
      )}

      {mobileMenuOpen && isLoggedIn && effectiveRole === "admin" && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex flex-col p-4 space-y-2">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/admin/dashboard")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/admin/events")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Calendar className="w-5 h-5" />
              Events
            </Link>
            <Link
              href="/admin/announcements"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/admin/announcements")
                ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active)] font-medium"
                : "text-[var(--color-nav-text)] hover:bg-[var(--color-nav-hover-bg)]"
                }`}
            >
              <Megaphone className="w-5 h-5" />
              Announcements
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
