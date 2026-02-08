"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '@/lib/api';
import { Notification } from '@/types/notification';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuthStore } from '@/lib/store';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    // Only fetch if user has a token and is a student
    const token = localStorage.getItem('token');
    if (!token || role !== 'student') return;

    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const fetchUnreadCount = async () => {
    if (role !== 'student') return;
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data?.success && response.data.data) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (role !== 'student') return;
    setLoading(true);
    try {
      const response = await notificationAPI.getAll({ limit: 10 });
      if (response.data?.success && response.data.data) {
        setNotifications(response.data.data as Notification[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
}

