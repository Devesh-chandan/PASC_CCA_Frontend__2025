"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { galleryAPI } from '@/lib/api';
import { EventGallery } from '@/types/gallery';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface GalleryManagerProps {
    eventId: number;
}

export function GalleryManager({ eventId }: GalleryManagerProps) {
    const [gallery, setGallery] = useState<EventGallery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteImageId, setDeleteImageId] = useState<number | null>(null);

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

    const handleDeleteImage = (id: number) => {
        setDeleteImageId(id);
    };

    const handleDeleteConfirm = async () => {
        if (deleteImageId === null) return;
        try {
            const response = await galleryAPI.delete(deleteImageId);
            if (response.data?.success) {
                fetchGallery();
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        } finally {
            setDeleteImageId(null);
        }
    };

    if (loading) return <Skeleton className="h-40 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                        <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                    </span>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                        Visual Archive ({gallery.length})
                    </h3>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Photo
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[var(--color-surface)]/50 p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                            Image URL
                        </label>
                        <Input
                            placeholder="https://images.unsplash.com/..."
                            value={formData.imageUrl}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                            Caption <span className="text-[10px] text-muted-foreground font-medium lowercase">(optional)</span>
                        </label>
                        <Input
                            placeholder="Enter a descriptive caption..."
                            value={formData.caption}
                            onChange={e => setFormData({ ...formData, caption: e.target.value })}
                            className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl px-5 h-10 border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">Cancel</Button>
                        <Button size="sm" onClick={handleAddImage} disabled={submitting} className="bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] rounded-xl px-5 h-10 font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {gallery.map(image => (
                        <div key={image.id} className="relative aspect-square group rounded-2xl overflow-hidden border border-[var(--color-border-light)] shadow-sm hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all">
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

            {/* Delete Image Dialog */}
            <Dialog open={deleteImageId !== null} onOpenChange={(open) => { if (!open) setDeleteImageId(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Photo?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        Are you sure you want to delete this photo? This action cannot be undone.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteImageId(null)}>
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
