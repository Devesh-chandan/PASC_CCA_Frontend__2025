"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit, ExternalLink, FileText, Video, Presentation, Code2, Link as LinkIcon, FileIcon, Search, Globe, Download } from 'lucide-react';
import { resourceAPI, eventAPI } from '@/lib/api';
import { EventResource, ResourceType, ResourceCreateInput } from '@/types/resource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatFileSize } from '@/lib/utils';

export default function EventResourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number>(0);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [resources, setResources] = useState<EventResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteResourceId, setDeleteResourceId] = useState<number | null>(null);
  const [editingResource, setEditingResource] = useState<EventResource | null>(null);
  const [formData, setFormData] = useState<ResourceCreateInput>({
    eventId: 0,
    title: '',
    description: '',
    type: 'DOCUMENT',
    url: '',
    fileSize: undefined,
  });

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      const numId = parseInt(id);
      setEventId(numId);
      setFormData(prev => ({ ...prev, eventId: numId }));
      
      try {
        const eventResponse = await eventAPI.getById(numId);
        if (eventResponse.data?.success && eventResponse.data.data) {
          const event = eventResponse.data.data as any;
          setEventTitle(event.title);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }

      fetchResources(numId);
    };
    init();
  }, [params]);

  const fetchResources = async (id: number) => {
    try {
      const response = await resourceAPI.getEventResources(id);
      if (response.data?.success && response.data.data) {
        setResources(response.data.data as EventResource[]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingResource) {
        await resourceAPI.update(editingResource.id, formData);
      } else {
        await resourceAPI.create(formData);
      }
      setShowDialog(false);
      resetForm();
      fetchResources(eventId);
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteResourceId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteResourceId === null) return;
    try {
      await resourceAPI.delete(deleteResourceId);
      fetchResources(eventId);
    } catch (error) {
      console.error('Error deleting resource:', error);
    } finally {
      setDeleteResourceId(null);
    }
  };

  const handleEdit = (resource: EventResource) => {
    setEditingResource(resource);
    setFormData({
      eventId: resource.eventId,
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      fileSize: resource.fileSize || undefined,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      eventId,
      title: '',
      description: '',
      type: 'DOCUMENT',
      url: '',
      fileSize: undefined,
    });
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'SLIDES': return <Presentation className="w-5 h-5" />;
      case 'VIDEO': return <Video className="w-5 h-5" />;
      case 'CODE': return <Code2 className="w-5 h-5" />;
      case 'DOCUMENT': return <FileText className="w-5 h-5" />;
      case 'LINK': return <LinkIcon className="w-5 h-5" />;
      default: return <FileIcon className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: ResourceType) => {
    switch (type) {
      case 'SLIDES': return 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
      case 'VIDEO': return 'bg-red-100/50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'CODE': return 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'DOCUMENT': return 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'LINK': return 'bg-purple-100/50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-slate-100/50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="rounded-2xl sm:rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/admin/events')}
              className="flex items-center gap-2 self-start px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--color-border-light)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Back to Events</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-border-light)] flex items-center justify-center shrink-0 mt-0.5">
                  <FileIcon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Event Resources</h1>
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-1">
                    {eventTitle || 'Manage study materials and assets'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-transparent bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                Add New Resource
              </button>
            </div>
          </div>
        </header>

        {/* Resources List */}
        <div className="bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-primary" />
              Stored Resources
              {!loading && resources.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {resources.length}
                </span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-[2rem] border border-dashed border-border/50">
              <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 shadow-sm">
                <FileIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-xl font-bold text-foreground">No resources yet</p>
              <p className="max-w-xs text-center mt-2 font-medium">
                Upload slides, documents, or links for students to access.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowDialog(true);
                }}
                className="mt-10 rounded-2xl px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
              >
                Add Your First Resource
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map(resource => (
                <div
                  key={resource.id}
                  className="group relative bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${getResourceColor(resource.type)} group-hover:scale-110 transition-transform duration-300`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2 rounded-xl bg-[var(--color-info)]/10 text-[var(--color-info)] hover:bg-[var(--color-info)]/20 transition-all active:scale-90"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {resource.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getResourceColor(resource.type)}`}>
                        {resource.type}
                      </span>
                      {resource.fileSize && (
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Download className="w-2.5 h-2.5" />
                          {formatFileSize(resource.fileSize)}
                        </span>
                      )}
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 group/link"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shadow-inner">
                {editingResource ? <Edit className="w-6 h-6 text-[var(--color-primary)]" /> : <Plus className="w-6 h-6 text-[var(--color-primary)]" />}
              </div>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Workshop Slides - Introduction to React"
                  className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium text-sm text-[var(--color-text-primary)] placeholder:font-medium outline-none"
                  rows={3}
                  placeholder="What is this resource about?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Type</label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                    className="w-full h-12 pl-4 pr-10 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-semibold text-sm cursor-pointer appearance-none text-[var(--color-text-primary)]"
                  >
                    <option value="SLIDES">📂 Slides</option>
                    <option value="VIDEO">🎥 Video</option>
                    <option value="CODE">💻 Code</option>
                    <option value="DOCUMENT">📄 Document</option>
                    <option value="LINK">🔗 Link</option>
                    <option value="OTHER">📁 Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-secondary)]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">File Size (Optional)</label>
                <Input
                  value={formData.fileSize || ''}
                  onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || undefined })}
                  placeholder="Size in bytes"
                  type="number"
                  className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">URL / Source Link</label>
                <div className="relative">
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    type="url"
                    className="h-12 pl-11 pr-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              className="rounded-xl px-8 h-12 border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="rounded-xl px-8 h-12 bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 font-bold">
              {editingResource ? 'Update Info' : 'Attach Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Resource Delete Confirmation Dialog */}
      <Dialog open={deleteResourceId !== null} onOpenChange={(open) => { if (!open) setDeleteResourceId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Resource?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Are you sure you want to delete this study material/asset? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteResourceId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


