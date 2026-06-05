"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Megaphone, AlertCircle, AlertTriangle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
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

// ---------- Reusable Pagination bar ----------
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className='flex items-center justify-center gap-1.5 mt-8'>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className='w-4 h-4' /> Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={'dots-' + idx} className='px-2 py-2 text-[var(--color-text-muted)] text-sm select-none'>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={
              'w-10 h-10 rounded-xl text-sm font-medium transition-all border ' +
              (currentPage === page
                ? 'bg-[var(--color-button-primary)] text-white border-transparent shadow-sm'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]')
            }
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  getPriorityIcon,
  getPriorityColor
}: {
  announcement: Announcement;
  onEdit: (a: Announcement) => void;
  onDelete: (id: number) => void;
  getPriorityIcon: (priority: AnnouncementPriority) => React.ReactNode;
  getPriorityColor: (priority: AnnouncementPriority) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const message = announcement.message || '';
  const isLong = message.split(/\s+/).length > 60 || message.length > 300;

  return (
    <div className="transition-[background-color,box-shadow,border-color] p-4 md:p-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] hover:bg-[var(--color-surface-hover)]/40 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex-shrink-0 mt-1">
          {getPriorityIcon(announcement.priority)}
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
            <p className={`text-sm md:text-[15px] whitespace-pre-wrap leading-[1.6] text-[var(--color-text-secondary)] ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
              {announcement.message}
            </p>
            {isLong && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline self-start mt-1"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}

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
            onClick={() => onEdit(announcement)}
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-xl transition-colors"
          >
            <Edit className="w-4 h-4 text-[var(--color-primary)]" />
          </button>
          <button
            onClick={() => onDelete(announcement.id)}
            className="p-2 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
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
        setCurrentPage(1);
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
      case 'LOW': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'NORMAL': return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
      case 'HIGH': return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20';
      case 'URGENT': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    }
  };

  const getPriorityIcon = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'LOW':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-500" />
          </div>
        );
      case 'NORMAL':
        return (
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-green-500" />
          </div>
        );
      case 'HIGH':
        return (
          <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
          </div>
        );
      case 'URGENT':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        );
    }
  };

  const totalPages = Math.ceil(announcements.length / PAGE_SIZE);
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
              {paginatedAnnouncements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={setDeleteTargetId}
                  getPriorityIcon={getPriorityIcon}
                  getPriorityColor={getPriorityColor}
                />
              ))}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent 
          className="max-w-md p-0 overflow-hidden rounded-2xl border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl max-h-[90vh] flex flex-col"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <DialogHeader className="p-4 pb-0 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shadow-inner">
                {editingAnnouncement ? <Edit className="w-5 h-5 text-[var(--color-primary)]" /> : <Plus className="w-5 h-5 text-[var(--color-primary)]" />}
              </div>
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-2.5 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
                className="h-10 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium text-sm text-[var(--color-text-primary)] placeholder:font-medium outline-none resize-none"
                rows={3}
                placeholder="Announcement message"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Priority</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'LOW', label: 'Low', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                  { value: 'NORMAL', label: 'Normal', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' },
                  { value: 'HIGH', label: 'High', color: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20' },
                  { value: 'URGENT', label: 'Urgent', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority.value as AnnouncementPriority })}
                    className={cn(
                      "h-8 rounded-lg px-3.5 text-xs font-bold border transition-all active:scale-95",
                      formData.priority === priority.value
                        ? `${priority.color} ring-2 ring-offset-1 ring-current border-transparent`
                        : "bg-transparent border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    )}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Target Departments (optional)</label>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <Button
                    key={dept}
                    type="button"
                    variant={formData.targetAudience?.departments?.includes(dept) ? "default" : "outline"}
                    onClick={() => toggleDepartment(dept)}
                    className={cn(
                      "h-8 rounded-lg px-3.5 text-xs font-bold active:scale-95 transition-all",
                      formData.targetAudience?.departments?.includes(dept)
                        ? "bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] border-transparent"
                        : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    )}
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Target Years (optional)</label>
              <div className="flex gap-2">
                {years.map(year => (
                  <Button
                    key={year}
                    type="button"
                    variant={formData.targetAudience?.years?.includes(year) ? "default" : "outline"}
                    onClick={() => toggleYear(year)}
                    className={cn(
                      "h-8 rounded-lg px-3.5 text-xs font-bold active:scale-95 transition-all",
                      formData.targetAudience?.years?.includes(year)
                        ? "bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] border-transparent"
                        : "border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    )}
                  >
                    Year {year}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={formData.expiresAt instanceof Date
                  ? formData.expiresAt.toISOString().slice(0, 16)
                  : (formData.expiresAt || '')
                }
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="h-10 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-text-primary)] outline-none"
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

          <DialogFooter className="p-4 pt-0 flex gap-2.5 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
                setSubmitError(null);
              }}
              disabled={submitting}
              className="rounded-lg px-5 h-10 text-sm border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !formData.title || !formData.message}
              className="rounded-lg px-5 h-10 text-sm bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 font-bold"
            >
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
