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
import { useToast } from '@/components/ui/toast';

const departments = ['CE', 'IT', 'ENTC', 'ECE', 'AIDS'];
const years = [1, 2];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const { success, error: toastError } = useToast();
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

      if (process.env.NODE_ENV === 'development') {
        console.log('Creating announcement with payload:', payload);
      }

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

  const handleDeleteConfirm = async () => {
    if (deleteTargetId == null) return;
    setDeleteSubmitting(true);
    try {
      await announcementAPI.delete(deleteTargetId);
      success('Announcement Deleted', 'The announcement has been removed.');
      fetchAnnouncements();
    } catch (deleteErr: any) {
      console.error('Error deleting announcement:', deleteErr);
      toastError('Deletion Failed', deleteErr.response?.data?.error || 'Failed to delete announcement');
    } finally {
      setDeleteSubmitting(false);
      setDeleteTargetId(null);
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
      case 'LOW': return 'bg-[var(--color-surface)] text-[var(--color-text-primary)]';
      case 'NORMAL': return 'bg-[var(--color-surface-hover)] text-[var(--color-primary)]';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Announcements</h1>
                <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-1">
                  Create and manage announcements for students
                </p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowDialog(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-transparent bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          </div>
        </header>

        {/* Announcements List */}
        <div className="mt-4">
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
            <div className="space-y-3">
              {announcements.map(announcement => (
                <div
                  key={announcement.id}
                  className="transition-[background-color,box-shadow,border-color] p-4 md:p-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] hover:bg-[var(--color-surface-hover)]/40 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-orange-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                          {announcement.priority} PRIORITY
                        </h4>
                      </div>
                      <h3 className={`text-[15px] md:text-base font-semibold leading-snug text-[var(--color-text-primary)]`}>
                        {announcement.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 mb-3">
                        <p className="text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide">
                          {new Date(announcement.createdAt).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric' })}
                        </p>
                      </div>

                      <div className="bg-[var(--color-surface)]/70 border border-[var(--color-border-light)]/40 p-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col gap-3">
                        <p className={`text-sm md:text-[15px] whitespace-pre-wrap leading-[1.6] text-[var(--color-text-secondary)]`}>
                          {announcement.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--color-text-muted)]/80 pt-3 border-t border-[var(--color-border-light)]/80 font-semibold uppercase tracking-wider">
                          {announcement.expiresAt && (
                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expires: {formatDateTime(announcement.expiresAt)}</span>
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

                    </div>

                    <div className="flex gap-2 flex-shrink-0 mt-1">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4 text-[var(--color-primary)]" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(announcement.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
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
                className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus)] bg-[var(--color-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none text-sm transition-shadow"
                rows={5}
                placeholder="Announcement message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'LOW', label: 'Low', color: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border-[var(--color-border)]' },
                  { value: 'NORMAL', label: 'Normal', color: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-surface)] border-[var(--color-border)]' },
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
                        ? `${priority.color} ring-2 ring-offset-1 ring-current border-transparent`
                        : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTargetId != null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            This action cannot be undone. The announcement will be permanently removed for all students.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main >


  );
}
