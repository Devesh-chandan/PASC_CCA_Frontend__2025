"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Search, Maximize2, X } from 'lucide-react';
import { galleryAPI, eventAPI } from '@/lib/api';
import { EventGallery, GalleryCreateInput } from '@/types/gallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function EventGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number>(0);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [gallery, setGallery] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [isEventDeleted, setIsEventDeleted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<EventGallery | null>(null);
  const [formData, setFormData] = useState<GalleryCreateInput>({
    eventId: 0,
    imageUrl: '',
    caption: '',
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
          setIsEventDeleted(event.isDeleted ?? false);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }

      fetchGallery(numId);
    };
    init();
  }, [params]);

  const fetchGallery = async (id: number) => {
    try {
      const response = await galleryAPI.getEventGallery(id);
      if (response.data?.success && response.data.data) {
        setGallery(response.data.data as EventGallery[]);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await galleryAPI.create(formData);
      setShowDialog(false);
      resetForm();
      fetchGallery(eventId);
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteImageId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteImageId === null) return;
    try {
      await galleryAPI.delete(deleteImageId);
      fetchGallery(eventId);
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setDeleteImageId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      eventId,
      imageUrl: '',
      caption: '',
    });
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
                  <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Event Gallery</h1>
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] mt-1">
                    {eventTitle || 'Manage event photos and memories'}
                  </p>
                </div>
              </div>
              {!isEventDeleted && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowDialog(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-transparent bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Gallery Grid Section */}
        <div className="bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] p-6 sm:p-10 shadow-sm min-h-[500px]">
          <div className="flex items-center justify-between mb-10 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-primary" />
              Captured Moments
              {!loading && gallery.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {gallery.length} Photos
                </span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton key={i} className="aspect-square w-full rounded-[1.5rem]" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-[2.5rem] border border-dashed border-border/50">
              <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center mb-8 shadow-sm">
                <ImageIcon className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-xl font-semibold text-foreground">No photos yet</p>
              <p className="max-w-xs text-center mt-3 font-medium text-base">
                Your event gallery is empty. Start adding some photos to document the event.
              </p>
              {!isEventDeleted && (
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(true)}
                  className="mt-10 rounded-2xl px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
                >
                  Upload First Photo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gallery.map(image => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden bg-background border border-border/50 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.caption || 'Event photo'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Glass Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center">
                    <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(image);
                          }}
                          className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors"
                          title="View Full Size"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                        {!isEventDeleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(image.id);
                            }}
                            className="p-3 bg-red-500/80 backdrop-blur-md rounded-2xl text-white hover:bg-red-600 transition-colors"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      {image.caption && (
                        <p className="text-white text-sm font-medium leading-tight line-clamp-2 px-2">
                          "{image.caption}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Caption Badge (Hidden on Hover) */}
                  {image.caption && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-2.5 group-hover:opacity-0 transition-opacity duration-300">
                      <p className="text-white text-[10px] font-medium uppercase tracking-wider line-clamp-1">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shadow-inner">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              Add New Photo
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  Image URL
                </label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  type="url"
                  className="h-12 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] focus-visible:border-[var(--color-primary)] focus-visible:ring-[var(--color-primary)]/10 text-sm font-semibold placeholder:font-medium text-foreground outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  Caption <span className="text-[10px] text-muted-foreground font-medium lowercase">(optional)</span>
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium text-sm text-[var(--color-text-primary)] placeholder:font-medium outline-none"
                  rows={3}
                  placeholder="Describe this moment..."
                />
              </div>

              {formData.imageUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] ml-1">Live Preview</label>
                  <div className="relative rounded-[1.5rem] overflow-hidden border-2 border-dashed border-[var(--color-border-light)] p-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-[1rem] shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Invalid+Image+URL+Provided';
                        (e.target as HTMLImageElement).className = "w-full h-64 object-center rounded-[1rem] opacity-50 grayscale";
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <div className="px-4 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] text-white font-semibold uppercase tracking-wider">
                        Photo Preview
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.imageUrl}
              className="rounded-xl px-8 h-12 bg-[var(--color-button-primary)] text-white hover:bg-[var(--color-button-primary-hover)] transition-all shadow-md hover:shadow-lg active:scale-95 font-bold"
            >
              Upload to Gallery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div className="max-w-6xl w-full flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="relative group w-full">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.caption || 'Event photo'}
                className="max-h-[80vh] w-auto mx-auto rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
              />
              {/* Image specific actions could go here */}
            </div>
            
            {selectedImage.caption && (
              <div className="max-w-2xl px-8 py-4 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/10 text-center">
                <p className="text-white text-xl font-medium leading-relaxed">
                  "{selectedImage.caption}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Photo Delete Confirmation Dialog */}
      <Dialog open={deleteImageId !== null} onOpenChange={(open) => { if (!open) setDeleteImageId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Photo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Are you sure you want to delete this photo from the event gallery? This action cannot be undone.
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


