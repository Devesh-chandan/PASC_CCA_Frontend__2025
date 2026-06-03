"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    image: "/signup.png",
    title: "Track & Achieve",
    desc: "Discover events, track credits, and compete with peers — all in one place.",
  },
  {
    image: "/signup.png",
    title: "Grow Your Network",
    desc: "Connect with ambitious peers and build your college journey.",
  },
  {
    image: "/signup.png",
    title: "Climb the Leaderboard",
    desc: "Earn achievements, rise through rankings, and get recognised.",
  },
  {
    image: "/signup.png",
    title: "Earn Credits",
    desc: "Every event you attend counts towards your co-curricular score.",
  },
];

export default function Signup() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((p) => (p + 1) % SLIDES.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--color-background)] overflow-hidden">

      {/* Subtle ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2BA6DF]/08 dark:bg-[#2BA6DF]/06 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#FDB811]/06 dark:bg-[#FDB811]/08 blur-3xl" />
      </div>

      {/* Main card — same structure as login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-[1000px] min-h-[580px] mx-4 my-8 rounded-2xl overflow-hidden
          border border-[var(--color-border-light)]
          shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_40px_rgba(15,23,42,0.06)]
          dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
      >

        {/* ── Left: Closed Registration Panel ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 sm:px-10 lg:px-12 bg-[var(--color-card)]">

          {/* Logo */}
          <div className="mb-8">
            <Image src="/logo.png" alt="PASC CCA" width={110} height={36} priority />
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 mb-5 self-start px-3 py-1.5 rounded-full
            bg-[var(--color-surface)] border border-[var(--color-border)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wide">
              Invite Only
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
            Registrations Closed
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-8 max-w-xs">
            The PASC CCA Platform is currently operating under a closed review.
            Contact the admin to request access.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--color-border-light)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              already have access?
            </span>
            <div className="flex-1 h-px bg-[var(--color-border-light)]" />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/login"
              className="flex-1 text-center py-3 px-5
                bg-[#1A90FF] hover:bg-[#1A90FF]/90
                text-white rounded-xl font-semibold text-sm
                transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Sign In
            </Link>
            <a
              href="mailto:admin@pasc.edu"
              className="flex-1 text-center py-3 px-5
                bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]
                text-[var(--color-text-primary)] border border-[var(--color-border)]
                rounded-xl font-semibold text-sm
                transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              Contact Admin
            </a>
          </div>
        </div>

        {/* ── Right: Showcase (identical to login page) ── */}
        <div className="hidden lg:flex w-[45%] flex-col relative overflow-hidden
          bg-gradient-to-br from-[#EBF6FD] via-[#D0EAFA] to-[#BAE0F8]
          dark:from-[#0d2a40] dark:via-[#134467] dark:to-[#0a1e32]"
        >
          {/* Inner glows */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#2BA6DF]/18 dark:bg-[#2BA6DF]/12 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-[#134467]/12 dark:bg-[#55B8E5]/08 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-10 gap-6">

            {/* Image — bg-removed PNG */}
            <div className="relative w-full max-w-[260px] h-[240px]">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-14 bg-[#2BA6DF]/20 dark:bg-[#2BA6DF]/15 blur-2xl rounded-full" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={SLIDES[currentSlide].image}
                    alt={SLIDES[currentSlide].title}
                    fill
                    className="object-contain drop-shadow-[0_12px_32px_rgba(19,68,103,0.18)] dark:drop-shadow-[0_16px_40px_rgba(43,166,223,0.22)]"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`t-${currentSlide}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="text-center px-4"
              >
                <h3 className="font-bold text-lg mb-1 text-[#134467] dark:text-white tracking-tight">
                  {SLIDES[currentSlide].title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#37474F]/75 dark:text-blue-100/60 max-w-[220px] mx-auto">
                  {SLIDES[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-400 ${
                    idx === currentSlide
                      ? "w-5 bg-[#134467] dark:bg-[#2BA6DF]"
                      : "w-1.5 bg-[#2BA6DF]/30 dark:bg-white/25 hover:bg-[#2BA6DF]/50 dark:hover:bg-white/45"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
