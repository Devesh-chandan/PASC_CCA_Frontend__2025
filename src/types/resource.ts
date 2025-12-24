export type ResourceType = 'SLIDES' | 'VIDEO' | 'CODE' | 'DOCUMENT' | 'LINK' | 'OTHER';

export interface EventResource {
  id: number;
  eventId: number;
  title: string;
  description?: string | null;
  type: ResourceType;
  url: string;
  fileSize?: number | null; // in bytes
  uploadedAt: string | Date;
}

export interface ResourceCreateInput {
  eventId: number;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  fileSize?: number;
}

export interface ResourceResponse {
  success: boolean;
  data?: EventResource | EventResource[];
  message?: string;
  error?: string;
}

