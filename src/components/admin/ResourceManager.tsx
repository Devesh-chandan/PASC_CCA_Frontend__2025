"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, FileText, Video, Code, Globe } from 'lucide-react';
import { resourceAPI } from '@/lib/api';
import { EventResource, ResourceType } from '@/types/resource';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ResourceManagerProps {
    eventId: number;
}

export function ResourceManager({ eventId }: ResourceManagerProps) {
    const [resources, setResources] = useState<EventResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteResourceId, setDeleteResourceId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        type: 'LINK' as ResourceType,
    });

    useEffect(() => {
        fetchResources();
    }, [eventId]);

    const fetchResources = async () => {
        try {
            const response = await resourceAPI.getEventResources(eventId);
            if (response.data?.success && response.data.data) {
                setResources(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async () => {
        if (!formData.title || !formData.url) return;
        setSubmitting(true);
        try {
            const response = await resourceAPI.create({
                ...formData,
                eventId,
            });
            if (response.data?.success) {
                setIsAdding(false);
                setFormData({ title: '', description: '', url: '', type: 'LINK' });
                fetchResources();
            }
        } catch (error) {
            console.error('Error adding resource:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteResource = (id: number) => {
        setDeleteResourceId(id);
    };

    const handleDeleteConfirm = async () => {
        if (deleteResourceId === null) return;
        try {
            const response = await resourceAPI.delete(deleteResourceId);
            if (response.data?.success) {
                fetchResources();
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
        } finally {
            setDeleteResourceId(null);
        }
    };

    const getIcon = (type: ResourceType) => {
        switch (type) {
            case 'SLIDES': return <FileText className="w-4 h-4" />;
            case 'VIDEO': return <Video className="w-4 h-4" />;
            case 'CODE': return <Code className="w-4 h-4" />;
            case 'DOCUMENT': return <FileText className="w-4 h-4" />;
            case 'OTHER': return <Globe className="w-4 h-4" />;
            default: return <LinkIcon className="w-4 h-4" />;
        }
    };

    if (loading) return <Skeleton className="h-40 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                        <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                    </span>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                        Asset Repository ({resources.length})
                    </h3>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Resource
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[var(--color-surface)]/50 p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Resource Title</label>
                            <Input
                                placeholder="Resource Title (e.g., Presentation Slides)"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Type</label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] pl-4 pr-10 py-2 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] text-foreground transition-all outline-none appearance-none cursor-pointer"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as ResourceType })}
                                >
                                    <option value="LINK">🔗 Link</option>
                                    <option value="SLIDES">📂 Slides</option>
                                    <option value="VIDEO">🎥 Video</option>
                                    <option value="CODE">💻 Code</option>
                                    <option value="DOCUMENT">📄 Document</option>
                                    <option value="OTHER">📁 Other</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-secondary)]">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">URL</label>
                        <Input
                            placeholder="URL (e.g., https://slides.google.com/...)"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Description (Optional)</label>
                        <Input
                            placeholder="Provide brief context..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl px-5 h-10 border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">Cancel</Button>
                        <Button size="sm" onClick={handleAddResource} disabled={submitting} className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] rounded-xl px-5 h-10 font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">
                            {submitting ? 'Adding...' : 'Save Resource'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-2xl">
                        No resources added yet.
                    </p>
                ) : (
                    resources.map(resource => (
                        <div key={resource.id} className="flex items-center justify-between p-4 bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-2xl hover:border-primary/30 hover:bg-[var(--color-surface-hover)]/40 transition-[background-color,border-color,box-shadow] shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-muted rounded-xl shrink-0">
                                    {getIcon(resource.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold truncate text-[var(--color-text)]">{resource.title}</div>
                                    <div className="text-xs text-[var(--color-text-muted)] truncate">{resource.url}</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                                onClick={() => handleDeleteResource(resource.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Resource Dialog */}
            <Dialog open={deleteResourceId !== null} onOpenChange={(open) => { if (!open) setDeleteResourceId(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Resource?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        Are you sure you want to delete this resource? This action cannot be undone.
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
