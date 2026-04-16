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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await galleryAPI.delete(id);
      fetchGallery(eventId);
    } catch (error) {
      console.error('Error deleting image:', error);
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
                <ImageIcon className="w-8 h-8 text-primary" />
                Event Gallery
              </h1>
              <p className="text-muted-foreground mt-1 text-base font-medium">
                {eventTitle || 'Manage event photos and memories'}
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
            Add Image
          </Button>
        </div>

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
              <Button
                variant="outline"
                onClick={() => setShowDialog(true)}
                className="mt-10 rounded-2xl px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold"
              >
                Upload First Photo
              </Button>
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
          <DialogHeader className="p-10 pb-0">
            <DialogTitle className="text-3xl font-bold text-foreground flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 shadow-inner">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              Add New Photo
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Image URL
                </label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  type="url"
                  className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary/20 text-lg"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Caption <span className="text-[10px] text-muted-foreground font-medium lowercase">(optional)</span>
                </label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-lg leading-relaxed"
                  rows={3}
                  placeholder="Describe this moment..."
                />
              </div>

              {formData.imageUrl && (
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Live Preview</label>
                  <div className="relative rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/20 p-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-[1.5rem] shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Invalid+Image+URL+Provided';
                        (e.target as HTMLImageElement).className = "w-full h-64 object-center rounded-[1.5rem] opacity-50 grayscale";
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

          <DialogFooter className="p-10 pt-0 flex gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              className="rounded-2xl px-10 h-14 font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.imageUrl}
              className="rounded-2xl px-10 h-14 shadow-xl hover:shadow-2xl transition-all active:scale-95 font-black bg-primary text-white"
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
    </div>
  );
}


