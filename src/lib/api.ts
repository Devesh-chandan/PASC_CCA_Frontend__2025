import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiUrl } from './utils';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login ONLY if not already on auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API Service Functions

// Auth APIs
export const authAPI = {
  login: (email: string, password: string, role: 'user' | 'admin') =>
    api.post(`/auth/${role}/login`, { email, password }),
  
  register: (data: any) =>
    api.post('/auth/user/register', data),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
  
  resetPassword: (email: string) =>
    api.post('/auth/reset-password', { email }),
};

// Event APIs
export const eventAPI = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/events', { params }),
  
  getById: (id: number) =>
    api.get(`/events/${id}`),
  
  create: (data: any) =>
    api.post('/events', data),
  
  update: (id: number, data: any) =>
    api.put(`/events/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/events/${id}`),
  
  getUserEvents: () =>
    api.get('/events/user/events'),
};

// RSVP APIs
export const rsvpAPI = {
  create: (eventId: number) =>
    api.post('/rsvp', { eventId }),
  
  cancel: (eventId: number) =>
    api.delete(`/rsvp/${eventId}`),
  
  getEventRsvps: (eventId: number) =>
    api.get(`/rsvp/event/${eventId}`),
  
  getUserRsvps: () =>
    api.get('/rsvp/user'),
};

// Attendance APIs
export const attendanceAPI = {
  markAttendance: (sessionId: number, code: string) =>
    api.post('/attendance/mark', { sessionId, code }),
  
  getUserStats: () =>
    api.get('/attendance/user-attendance-stats'),
  
  getSessionAttendance: (sessionId: number) =>
    api.get(`/attendance/session/${sessionId}`),
  
  createSession: (data: any) =>
    api.post('/attendance/session', data),
  
  updateSession: (sessionId: number, data: any) =>
    api.put(`/attendance/session/${sessionId}`, data),
  
  deleteSession: (sessionId: number) =>
    api.delete(`/attendance/session/${sessionId}`),
};

// Review APIs
export const reviewAPI = {
  create: (data: any) =>
    api.post('/reviews', data),
  
  getEventReviews: (eventId: number) =>
    api.get(`/reviews/event/${eventId}`),
  
  getEventStats: (eventId: number) =>
    api.get(`/reviews/event/${eventId}/stats`),
  
  update: (reviewId: number, data: any) =>
    api.put(`/reviews/${reviewId}`, data),
  
  delete: (reviewId: number) =>
    api.delete(`/reviews/${reviewId}`),
};

// Resource APIs
export const resourceAPI = {
  create: (data: any) =>
    api.post('/resources', data),
  
  getEventResources: (eventId: number) =>
    api.get(`/resources/event/${eventId}`),
  
  update: (resourceId: number, data: any) =>
    api.put(`/resources/${resourceId}`, data),
  
  delete: (resourceId: number) =>
    api.delete(`/resources/${resourceId}`),
};

// Gallery APIs
export const galleryAPI = {
  create: (data: any) =>
    api.post('/gallery', data),
  
  getEventGallery: (eventId: number) =>
    api.get(`/gallery/event/${eventId}`),
  
  update: (galleryId: number, data: any) =>
    api.put(`/gallery/${galleryId}`, data),
  
  delete: (galleryId: number) =>
    api.delete(`/gallery/${galleryId}`),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params?: { read?: boolean; limit?: number }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (notificationId: number) =>
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  
  delete: (notificationId: number) =>
    api.delete(`/notifications/${notificationId}`),
};

// Announcement APIs
export const announcementAPI = {
  getAll: (params?: { priority?: string; limit?: number }) =>
    api.get('/announcements', { params }),
  
  getById: (id: number) =>
    api.get(`/announcements/${id}`),
  
  create: (data: any) =>
    api.post('/announcements', data),
  
  update: (id: number, data: any) =>
    api.put(`/announcements/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/announcements/${id}`),
  
  markAsRead: (id: number) =>
    api.post(`/announcements/${id}/read`),
};

// Leaderboard APIs
export const leaderboardAPI = {
  get: (params?: { period?: string; year?: number; month?: number; limit?: number }) =>
    api.get('/leaderboard', { params }),
  
  getMyRank: () =>
    api.get('/leaderboard/my-rank'),
  
  getUserRank: (userId: number, period: string) =>
    api.get(`/leaderboard/user/${userId}`, { params: { period } }),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),
  
  getEventAnalytics: (eventId: number) =>
    api.get(`/analytics/event/${eventId}`),
  
  getUserAnalytics: () =>
    api.get('/analytics/user'),
};

// Calendar APIs
export const calendarAPI = {
  getEventLinks: (eventId: number) =>
    api.get(`/calendar/event/${eventId}`),
  
  getAllEventsCalendar: () =>
    api.get('/calendar/all'),
};

