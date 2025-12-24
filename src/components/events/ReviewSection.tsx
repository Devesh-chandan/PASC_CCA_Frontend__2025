"use client";

import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { reviewAPI } from '@/lib/api';
import { EventReview, ReviewStats, ReviewCreateInput } from '@/types/review';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from '@/lib/utils';

interface ReviewSectionProps {
  eventId: number;
  eventStatus: string;
}

export function ReviewSection({ eventId, eventStatus }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<ReviewCreateInput>({
    eventId,
    rating: 5,
    review: '',
    contentRating: 5,
    speakerRating: 5,
    organizationRating: 5,
    anonymous: false,
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getEventReviews(eventId);
      if (response.data?.success && response.data.data) {
        setReviews(response.data.data as EventReview[]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reviewAPI.getEventStats(eventId);
      if (response.data?.success && response.data.data) {
        setStats(response.data.data as ReviewStats);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const handleSubmitReview = async () => {
    setSubmitting(true);
    try {
      const response = await reviewAPI.create(formData);
      if (response.data?.success) {
        setShowReviewForm(false);
        fetchReviews();
        fetchStats();
        // Reset form
        setFormData({
          eventId,
          rating: 5,
          review: '',
          contentRating: 5,
          speakerRating: 5,
          organizationRating: 5,
          anonymous: false,
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl font-bold text-foreground">
                  {stats.averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-muted-foreground">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            {eventStatus === 'COMPLETED' && (
              <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                {showReviewForm ? 'Cancel' : 'Write Review'}
              </Button>
            )}
          </div>

          {/* Rating Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {stats.averageContentRating && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Content</p>
                {renderStars(Math.round(stats.averageContentRating))}
              </div>
            )}
            {stats.averageSpeakerRating && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Speaker</p>
                {renderStars(Math.round(stats.averageSpeakerRating))}
              </div>
            )}
            {stats.averageOrganizationRating && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Organization</p>
                {renderStars(Math.round(stats.averageOrganizationRating))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          
          <div className="space-y-4">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Overall Rating</label>
              {renderStars(formData.rating, true, (rating) => 
                setFormData({ ...formData, rating })
              )}
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                {renderStars(formData.contentRating || 5, true, (rating) => 
                  setFormData({ ...formData, contentRating: rating })
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Speaker</label>
                {renderStars(formData.speakerRating || 5, true, (rating) => 
                  setFormData({ ...formData, speakerRating: rating })
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization</label>
                {renderStars(formData.organizationRating || 5, true, (rating) => 
                  setFormData({ ...formData, organizationRating: rating })
                )}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Share your experience..."
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.anonymous}
                onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="anonymous" className="text-sm">
                Post anonymously
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reviews</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">
                    {review.anonymous ? 'Anonymous' : review.user?.name || 'User'}
                  </p>
                  {!review.anonymous && review.user?.department && (
                    <p className="text-sm text-muted-foreground">
                      {review.user.department}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {renderStars(review.rating)}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(review.createdAt))}
                  </p>
                </div>
              </div>
              
              {review.review && (
                <p className="text-foreground mt-2">{review.review}</p>
              )}
              
              {(review.contentRating || review.speakerRating || review.organizationRating) && (
                <div className="flex gap-4 mt-3 text-sm">
                  {review.contentRating && (
                    <span className="text-muted-foreground">
                      Content: {review.contentRating}/5
                    </span>
                  )}
                  {review.speakerRating && (
                    <span className="text-muted-foreground">
                      Speaker: {review.speakerRating}/5
                    </span>
                  )}
                  {review.organizationRating && (
                    <span className="text-muted-foreground">
                      Organization: {review.organizationRating}/5
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

