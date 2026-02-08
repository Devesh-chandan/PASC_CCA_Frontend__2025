"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, FileText, Video, Code, Globe } from 'lucide-react';
import { resourceAPI } from '@/lib/api';
import { EventResource, ResourceType } from '@/types/resource';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

interface ResourceManagerProps {
    eventId: number;
}

export function ResourceManager({ eventId }: ResourceManagerProps) {
    const [resources, setResources] = useState<EventResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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

    const handleDeleteResource = async (id: number) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            const response = await resourceAPI.delete(id);
            if (response.data?.success) {
                fetchResources();
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Event Resources
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Resource
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            placeholder="Resource Title (e.g., Presentation Slides)"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as ResourceType })}
                        >
                            <option value="LINK">Link</option>
                            <option value="SLIDES">Slides</option>
                            <option value="VIDEO">Video</option>
                            <option value="CODE">Code</option>
                            <option value="DOCUMENT">Document</option>
                        </select>
                    </div>
                    <Input
                        placeholder="URL"
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                    />
                    <Input
                        placeholder="Description (Optional)"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAddResource} disabled={submitting}>
                            {submitting ? 'Adding...' : 'Save Resource'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg">
                        No resources added yet.
                    </p>
                ) : (
                    resources.map(resource => (
                        <div key={resource.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-muted rounded-md shrink-0">
                                    {getIcon(resource.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{resource.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">{resource.url}</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                                onClick={() => handleDeleteResource(resource.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
