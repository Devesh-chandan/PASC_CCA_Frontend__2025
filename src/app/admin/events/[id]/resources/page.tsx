"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit, ExternalLink } from 'lucide-react';
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
      
      // Fetch event details
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

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Event Resources</h1>
            <p className="text-muted-foreground mt-1">{eventTitle}</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </Button>
        </div>

        {/* Resources List */}
        <div className="bg-card rounded-xl border border-border p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No resources yet</p>
              <p className="text-sm">Add resources like slides, videos, or documents</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(resource => (
                <div
                  key={resource.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {resource.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Resource
                      </a>
                      {resource.fileSize && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(resource.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(resource)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add Resource'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="SLIDES">Slides</option>
                <option value="VIDEO">Video</option>
                <option value="CODE">Code</option>
                <option value="DOCUMENT">Document</option>
                <option value="LINK">Link</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File Size (bytes, optional)</label>
              <Input
                value={formData.fileSize || ''}
                onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || undefined })}
                placeholder="1024000"
                type="number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingResource ? 'Update' : 'Add'} Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

