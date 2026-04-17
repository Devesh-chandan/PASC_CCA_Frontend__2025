"use client";

import { Megaphone } from 'lucide-react';
import { AnnouncementList } from '@/components/announcements/AnnouncementList';

export default function StudentAnnouncementsPage() {
    return (
        <main className="min-h-screen bg-[var(--color-background)]">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                <header className="bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Megaphone className="w-5 h-5 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Announcements</h1>
                                <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-1">
                                    Stay updated with the latest news and information
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--color-text-muted)]">
                        Latest Updates
                    </p>
                    <AnnouncementList />
                </div>
            </div>
        </main>
    );
}
