"use client";

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Edit2, Trash2, X } from 'lucide-react';
import { reviewAPI, authAPI } from '@/lib/api';
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
  const [editingReview, setEditingReview] = useState<EventReview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myReview, setMyReview] = useState<EventReview | null>(null);

  const [formData, setFormData] = useState<ReviewCreateInput>({
    eventId,
    rating: 5,
    review: '',
    contentRating: 5,
    speakerRating: 5,
    organizationRating: 5,
    anonymous: false,
  });

  // Get current user ID and role from localStorage, fetch if missing
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      let storedUserId = localStorage.getItem('userId');

      if (!token) return;

      // If userId is missing but we have token/role, try to fetch it
      if (!storedUserId && role) {
        try {
          let fetchedUserId = '';
          if (role === 'admin') {
            const res = await authAPI.getCurrentAdmin();
            if (res.data?.success && res.data.data?.admin) {
              fetchedUserId = res.data.data.admin.id.toString();
            }
          } else {
            const res = await authAPI.getCurrentUser();
            if (res.data?.success && res.data.data?.user) {
              fetchedUserId = res.data.data.user.id.toString();
            }
          }

          if (fetchedUserId) {
            localStorage.setItem('userId', fetchedUserId);
            storedUserId = fetchedUserId;
          }
        } catch (error) {
          console.error("Failed to fetch user info for delete permissions", error);
        }
      }

      if (storedUserId) {
        setCurrentUserId(Number(storedUserId));
      }
      if (role === 'admin') {
        setIsAdmin(true);
      }
    };

    checkAuth();
  }, []);

  // Sync formData with eventId when it changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      eventId: eventId
    }));
  }, [eventId]);

  useEffect(() => {
    fetchReviews();
    fetchStats();
    if (localStorage.getItem('token')) {
      fetchMyReview();
    }
  }, [eventId]);

  const fetchMyReview = async () => {
    try {
      const response = await reviewAPI.getMyReview(eventId);
      if (response.data?.success && response.data.data) {
        setMyReview(response.data.data as EventReview);
        return response.data.data;
      } else {
        setMyReview(null);
        return null;
      }
    } catch (error) {
      // Ignore 404 or other errors for my review
      setMyReview(null);
      return null;
    }
  };

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
      // Construct payload explicitly to ensure all fields are present
      const payload: ReviewCreateInput = {
        eventId: eventId,
        rating: formData.rating,
        review: formData.review || '',
        contentRating: formData.contentRating || 5,
        speakerRating: formData.speakerRating || 5,
        organizationRating: formData.organizationRating || 5,
        anonymous: formData.anonymous || false,
      };

      console.log('=== REVIEW SUBMISSION DEBUG ===');
      console.log('Payload being sent:', payload);
      console.log('FormData state:', formData);
      console.log('EventId:', eventId);
      console.log('==============================');

      if (editingReview) {
        // Update existing review
        const response = await reviewAPI.update(editingReview.id, payload);
        if (response.data?.success) {
          setShowReviewForm(false);
          setEditingReview(null);
          // Update myReview immediately
          setMyReview(response.data.data);
          fetchReviews();
          fetchStats();
          resetForm();
        }
      } else {
        // Create new review
        const response = await reviewAPI.create(payload);
        if (response.data?.success) {
          setShowReviewForm(false);
          // Set my review from response
          setMyReview(response.data.data);
          fetchReviews();
          fetchStats();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('=== REVIEW SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Form data state:', formData);
      console.error('==============================');

      if (error.response?.data?.message) {
        const msg = error.response.data.message;

        // If error is "already reviewed", try fetching my review
        if (msg.includes('already reviewed')) {
          const review = await fetchMyReview();
          if (review) {
            alert("You have already reviewed this event. We loaded your review so you can edit it.");
            handleEditReview(review as EventReview);
          } else {
            // Fallback if we can't fetch it (e.g. backend route issue)
            alert(`Error: ${msg}. Please refresh the page.`);
          }
        } else {
          alert(`Error: ${msg}`);
        }
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review: EventReview) => {
    setEditingReview(review);
    setFormData({
      eventId,
      rating: review.rating,
      review: review.review || '',
      contentRating: review.contentRating || 5,
      speakerRating: review.speakerRating || 5,
      organizationRating: review.organizationRating || 5,
      anonymous: review.anonymous || false,
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
      const response = await reviewAPI.delete(reviewId);
      if (response.data?.success) {
        fetchReviews();
        fetchStats();
        // Clear myReview if I deleted it
        if (myReview && myReview.id === reviewId) {
          setMyReview(null);
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      eventId,
      rating: 5,
      review: '',
      contentRating: 5,
      speakerRating: 5,
      organizationRating: 5,
      anonymous: false,
    });
    setEditingReview(null);
  };

  const handleCancelEdit = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    resetForm();
  };

  // Check if current user has already reviewed
  const userHasReviewed = !!myReview || reviews.some(r => r.userId === currentUserId);

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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
            {['COMPLETED', 'ONGOING', 'UPCOMING'].includes(eventStatus) && !userHasReviewed && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)}>
                Write Review
              </Button>
            )}
            {showReviewForm && (
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
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
          <h3 className="text-lg font-semibold mb-4">
            {editingReview ? 'Edit Your Review' : 'Write Your Review'}
          </h3>

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
              {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
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
          (() => {
            const displayedReviews = [...reviews];
            if (myReview && !reviews.some(r => r.id === myReview.id)) {
              displayedReviews.unshift(myReview);
            }

            return displayedReviews.map(review => {
              const isOwnReview = review.userId === currentUserId;
              return (
                <div key={review.id} className={`bg-card rounded-lg border p-4 ${isOwnReview ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {review.anonymous ? 'Anonymous' : review.user?.name || 'User'}
                        {isOwnReview && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            Your review
                          </span>
                        )}
                      </p>
                      {!review.anonymous && review.user?.department && (
                        <p className="text-sm text-muted-foreground">
                          {review.user.department}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                          {formatDistanceToNow(new Date(review.createdAt))}
                        </p>
                      </div>
                      {/* Edit/Delete buttons for own reviews or Admin */}
                      {(isOwnReview || isAdmin) && (
                        <div className="flex gap-1">
                          {isOwnReview && (
                            <button
                              onClick={() => handleEditReview(review)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit review"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      )}
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
              );
            })
          })()
        )}
      </div>
    </div>
  );
}

