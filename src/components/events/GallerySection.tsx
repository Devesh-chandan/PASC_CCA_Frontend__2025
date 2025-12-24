"use client";

import { useState, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { galleryAPI } from '@/lib/api';
import { EventGallery } from '@/types/gallery';
import { Skeleton } from '../ui/skeleton';

interface GallerySectionProps {
  eventId: number;
}

export function GallerySection({ eventId }: GallerySectionProps) {
  const [gallery, setGallery] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<EventGallery | null>(null);

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  const fetchGallery = async () => {
    try {
      const response = await galleryAPI.getEventGallery(eventId);
      if (response.data?.success && response.data.data) {
        setGallery(response.data.data as EventGallery[]);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  if (gallery.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No photos available yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallery.map(image => (
          <div
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
          >
            <img
              src={image.imageUrl}
              alt={image.caption || 'Event photo'}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm line-clamp-2">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.caption || 'Event photo'}
              className="w-full h-auto rounded-lg"
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {selectedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

