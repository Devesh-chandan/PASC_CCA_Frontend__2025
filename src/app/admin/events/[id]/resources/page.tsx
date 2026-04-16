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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await resourceAPI.delete(id);
      fetchResources(eventId);
    } catch (error) {
      console.error('Error deleting resource:', error);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 self-start px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FileIcon className="w-8 h-8 text-primary" />
                Event Resources
              </h1>
              <p className="text-muted-foreground mt-1 text-base font-medium">
                {eventTitle || 'Manage study materials and assets'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="px-6 py-6 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
            Add New Resource
          </Button>
        </div>

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
                className="mt-8 rounded-xl"
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
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-all active:scale-90"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all active:scale-90"
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
              <div className="p-2 rounded-xl bg-primary/10">
                {editingResource ? <Edit className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
              </div>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Workshop Slides - Introduction to React"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                  rows={3}
                  placeholder="What is this resource about?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                  className="w-full h-12 px-4 bg-muted/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-sm appearance-none cursor-pointer"
                >
                  <option value="SLIDES">📂 Slides</option>
                  <option value="VIDEO">🎥 Video</option>
                  <option value="CODE">💻 Code</option>
                  <option value="DOCUMENT">📄 Document</option>
                  <option value="LINK">🔗 Link</option>
                  <option value="OTHER">📁 Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">File Size (Optional)</label>
                <Input
                  value={formData.fileSize || ''}
                  onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || undefined })}
                  placeholder="Size in bytes"
                  type="number"
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">URL / Source Link</label>
                <div className="relative">
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    type="url"
                    className="h-12 pl-11 rounded-xl bg-muted/30 border-border/50 focus:ring-primary/20"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              className="rounded-xl px-8 h-12"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="rounded-xl px-8 h-12 shadow-md hover:shadow-lg transition-all active:scale-95">
              {editingResource ? 'Update Info' : 'Attach Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


