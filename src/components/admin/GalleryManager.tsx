"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { galleryAPI } from '@/lib/api';
import { EventGallery } from '@/types/gallery';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

interface GalleryManagerProps {
    eventId: number;
}

export function GalleryManager({ eventId }: GalleryManagerProps) {
    const [gallery, setGallery] = useState<EventGallery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        imageUrl: '',
        caption: '',
    });

    useEffect(() => {
        fetchGallery();
    }, [eventId]);

    const fetchGallery = async () => {
        try {
            const response = await galleryAPI.getEventGallery(eventId);
            if (response.data?.success && response.data.data) {
                setGallery(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = async () => {
        if (!formData.imageUrl) return;
        setSubmitting(true);
        try {
            const response = await galleryAPI.create({
                ...formData,
                eventId,
            });
            if (response.data?.success) {
                setIsAdding(false);
                setFormData({ imageUrl: '', caption: '' });
                fetchGallery();
            }
        } catch (error) {
            console.error('Error adding image:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteImage = async (id: number) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;
        try {
            const response = await galleryAPI.delete(id);
            if (response.data?.success) {
                fetchGallery();
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    if (loading) return <Skeleton className="h-40 w-full" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Event Gallery
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Photo
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                    <Input
                        placeholder="Image URL"
                        value={formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                    <Input
                        placeholder="Caption (Optional)"
                        value={formData.caption}
                        onChange={e => setFormData({ ...formData, caption: e.target.value })}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAddImage} disabled={submitting}>
                            {submitting ? 'Uploading...' : 'Save Photo'}
                        </Button>
                    </div>
                </div>
            )}

            {gallery.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No photos yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map(image => (
                        <div key={image.id} className="relative aspect-square group rounded-lg overflow-hidden border">
                            <img
                                src={image.imageUrl}
                                alt={image.caption || 'Event photo'}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="rounded-full h-8 w-8"
                                    onClick={() => handleDeleteImage(image.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            {image.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1">
                                    <p className="text-[10px] text-white truncate text-center">{image.caption}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
