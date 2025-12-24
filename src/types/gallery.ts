export interface EventGallery {
  id: number;
  eventId: number;
  imageUrl: string;
  caption?: string | null;
  uploadedAt: string | Date;
}

export interface GalleryCreateInput {
  eventId: number;
  imageUrl: string;
  caption?: string;
}

export interface GalleryResponse {
  success: boolean;
  data?: EventGallery | EventGallery[];
  message?: string;
  error?: string;
}

