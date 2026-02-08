"use client";

import { Bell } from 'lucide-react';
import { NotificationList } from '@/components/notifications/NotificationList';

export default function StudentNotificationsPage() {
    return (
        <main className="min-h-screen bg-background p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your personal activity and event updates
                    </p>
                </div>

                {/* Notifications */}
                <NotificationList />
            </div>
        </main>
    );
}
