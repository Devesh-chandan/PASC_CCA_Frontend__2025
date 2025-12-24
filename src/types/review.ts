export interface EventReview {
  id: number;
  eventId: number;
  userId: number;
  rating: number; // 1-5
  review?: string | null;
  contentRating?: number | null; // 1-5
  speakerRating?: number | null; // 1-5
  organizationRating?: number | null; // 1-5
  anonymous: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    name?: string;
    department?: string;
  };
}

export interface ReviewCreateInput {
  eventId: number;
  rating: number;
  review?: string;
  contentRating?: number;
  speakerRating?: number;
  organizationRating?: number;
  anonymous?: boolean;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  averageContentRating?: number;
  averageSpeakerRating?: number;
  averageOrganizationRating?: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewResponse {
  success: boolean;
  data?: EventReview | EventReview[] | ReviewStats;
  message?: string;
  error?: string;
}

