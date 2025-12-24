"use client";

import { Megaphone } from 'lucide-react';
import { AnnouncementList } from '@/components/announcements/AnnouncementList';

export default function StudentAnnouncementsPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with the latest news and information
          </p>
        </div>

        {/* Announcements */}
        <AnnouncementList />
      </div>
    </main>
  );
}

