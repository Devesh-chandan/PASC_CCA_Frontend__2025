export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: number;
  adminId: number;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  targetAudience?: {
    departments?: string[];
    years?: number[];
  } | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  isRead?: boolean;
}

export interface AnnouncementCreateInput {
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  targetAudience?: {
    departments?: string[];
    years?: number[];
  };
  expiresAt?: string | Date;
}

export interface AnnouncementResponse {
  success: boolean;
  data?: Announcement | Announcement[];
  message?: string;
  error?: string;
}

