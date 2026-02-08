"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Megaphone, AlertCircle } from 'lucide-react';
import { announcementAPI } from '@/lib/api';
import { Announcement, AnnouncementPriority, AnnouncementCreateInput } from '@/types/announcement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDateTime, cn } from '@/lib/utils';

const departments = ['CE', 'IT', 'ENTC', 'ECE', 'AIDS'];
const years = [1, 2, 3, 4];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AnnouncementCreateInput>({
    title: '',
    message: '',
    priority: 'NORMAL',
    targetAudience: { departments: [], years: [] },
    expiresAt: undefined,
  });

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in as an admin to manage announcements');
      setLoading(false);
      return;
    }
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setError(null);
    try {
      const response = await announcementAPI.getAllAdmin({ limit: 50 });
      if (response.data?.success && response.data.data) {
        setAnnouncements(response.data.data as Announcement[]);
      }
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch announcements';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      // Sanitize payload
      const targetAudienceRaw = formData.targetAudience || { departments: [], years: [] };
      const targetAudience: any = {};

      if (targetAudienceRaw.departments && targetAudienceRaw.departments.length > 0) {
        targetAudience.departments = targetAudienceRaw.departments;
      }

      if (targetAudienceRaw.years && targetAudienceRaw.years.length > 0) {
        targetAudience.years = targetAudienceRaw.years;
      }

      // Check if targetAudience is empty (no departments or years)
      const hasTarget = Object.keys(targetAudience).length > 0;

      const payload = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        targetAudience: hasTarget ? targetAudience : undefined, // Send undefined if empty to let backend handle default
        expiresAt: formData.expiresAt && !isNaN(Date.parse(formData.expiresAt as string))
          ? new Date(formData.expiresAt).toISOString()
          : undefined
      };

      console.log('Creating announcement with payload:', payload);

      if (editingAnnouncement) {
        const response = await announcementAPI.update(editingAnnouncement.id, payload);
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to update announcement');
        }
      } else {
        const response = await announcementAPI.create(payload);
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to create announcement');
        }
      }
      setShowDialog(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save announcement';
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementAPI.delete(id);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      alert(error.response?.data?.error || 'Failed to delete announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience || { departments: [], years: [] },
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : undefined,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setSubmitError(null);
    setFormData({
      title: '',
      message: '',
      priority: 'NORMAL',
      targetAudience: { departments: [], years: [] },
      expiresAt: undefined,
    });
  };

  const toggleDepartment = (dept: string) => {
    const current = formData.targetAudience?.departments || [];
    const updated = current.includes(dept)
      ? current.filter(d => d !== dept)
      : [...current, dept];
    setFormData({
      ...formData,
      targetAudience: { ...formData.targetAudience, departments: updated }
    });
  };

  const toggleYear = (year: number) => {
    const current = formData.targetAudience?.years || [];
    const updated = current.includes(year)
      ? current.filter(y => y !== year)
      : [...current, year];
    setFormData({
      ...formData,
      targetAudience: { ...formData.targetAudience, years: updated }
    });
  };

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary" />
              Announcements
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage announcements for students
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </Button>
        </div>

        {/* Announcements List */}
        <div className="bg-card rounded-xl border border-border p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500 opacity-70" />
              <p className="text-lg mb-2 text-red-600 dark:text-red-400">{error}</p>
              <p className="text-sm text-muted-foreground mb-4">Make sure you are logged in as an admin</p>
              <Button onClick={() => window.location.href = '/auth/login'}>
                Go to Login
              </Button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No announcements yet</p>
              <p className="text-sm">Create your first announcement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div
                  key={announcement.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">
                          {announcement.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap mb-3">
                        {announcement.message}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Created: {formatDateTime(announcement.createdAt)}</span>
                        {announcement.expiresAt && (
                          <span>Expires: {formatDateTime(announcement.expiresAt)}</span>
                        )}
                        {announcement.targetAudience && (
                          <>
                            {announcement.targetAudience.departments && Array.isArray(announcement.targetAudience.departments) && announcement.targetAudience.departments.length > 0 && (
                              <span>Depts: {announcement.targetAudience.departments.join(', ')}</span>
                            )}
                            {announcement.targetAudience.years && Array.isArray(announcement.targetAudience.years) && announcement.targetAudience.years.length > 0 && (
                              <span>Years: {announcement.targetAudience.years.join(', ')}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={5}
                placeholder="Announcement message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200' },
                  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' },
                  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' },
                  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority.value as AnnouncementPriority })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      formData.priority === priority.value
                        ? `${priority.color} ring-2 ring-offset-1 ring-gray-400 border-transparent`
                        : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Departments (optional)</label>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <Button
                    key={dept}
                    type="button"
                    variant={formData.targetAudience?.departments?.includes(dept) ? "default" : "outline"}
                    onClick={() => toggleDepartment(dept)}
                    className="h-8 text-sm"
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Years (optional)</label>
              <div className="flex gap-2">
                {years.map(year => (
                  <Button
                    key={year}
                    type="button"
                    variant={formData.targetAudience?.years?.includes(year) ? "default" : "outline"}
                    onClick={() => toggleYear(year)}
                    className="h-8 text-sm"
                  >
                    Year {year}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={formData.expiresAt instanceof Date
                  ? formData.expiresAt.toISOString().slice(0, 16)
                  : (formData.expiresAt || '')
                }
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
                setSubmitError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.title || !formData.message}>
              {submitting ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}


