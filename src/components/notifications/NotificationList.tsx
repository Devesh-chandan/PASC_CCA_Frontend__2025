"use client";

import { useState, useEffect } from 'react';
import { notificationAPI } from '@/lib/api';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Skeleton } from '../ui/skeleton';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function NotificationList() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const role = useAuthStore((state) => state.role);

    useEffect(() => {
        if (role === 'student') {
            fetchNotifications();
        }
    }, [role]);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch more notifications for the full page view
            const response = await notificationAPI.getAll({ limit: 50 });
            if (response.data?.success && response.data.data) {
                setNotifications(response.data.data as Notification[]);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="bg-card p-4 rounded-lg border border-border animate-pulse">
                        <div className="h-4 bg-muted w-1/4 mb-2"></div>
                        <div className="h-3 bg-muted w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchNotifications}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
                {notifications.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                    />
                ))}
            </div>
        </div>
    );
}
