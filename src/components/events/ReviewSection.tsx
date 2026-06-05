"use client";

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { reviewAPI, authAPI } from '@/lib/api';
import { EventReview, ReviewStats, ReviewCreateInput } from '@/types/review';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

// ---------- Reusable Pagination bar ----------
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className='flex items-center justify-center gap-1.5 mt-8'>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className='w-4 h-4' /> Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={'dots-' + idx} className='px-2 py-2 text-[var(--color-text-muted)] text-sm select-none'>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={
              'w-10 h-10 rounded-xl text-sm font-medium transition-all border ' +
              (currentPage === page
                ? 'bg-[var(--color-button-primary)] text-white border-transparent shadow-sm'
                : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface)]')
            }
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className='w-4 h-4' />
      </button>
    </div>
  );
}

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
  const { success, error: toastError, info } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const PAGE_SIZE = 10;

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
    setCurrentPage(1);
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
            info('Review Found', 'You have already reviewed this event. Your existing review has been loaded for editing.');
            handleEditReview(review as EventReview);
          } else {
            // Fallback if we can't fetch it (e.g. backend route issue)
            toastError('Review Error', `${msg}. Please refresh the page.`);
          }
        } else {
          toastError('Review Error', msg);
        }
      } else {
        toastError('Submission Failed', 'Failed to submit review. Please try again.');
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
            className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--color-text-secondary)]'
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
        <div className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm dark:shadow-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {stats.averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-[var(--color-text-muted)]">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            {['COMPLETED', 'ONGOING', 'UPCOMING'].includes(eventStatus) && !userHasReviewed && !showReviewForm && (
              <Button 
                onClick={() => setShowReviewForm(true)} 
                className="bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] text-white shadow-sm"
              >
                Write Review
              </Button>
            )}
            {showReviewForm && (
              <Button variant="outline" onClick={handleCancelEdit} className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Rating Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {stats.averageContentRating && (
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Content</p>
                {renderStars(Math.round(stats.averageContentRating))}
              </div>
            )}
            {stats.averageSpeakerRating && (
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Speaker</p>
                {renderStars(Math.round(stats.averageSpeakerRating))}
              </div>
            )}
            {stats.averageOrganizationRating && (
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Organization</p>
                {renderStars(Math.round(stats.averageOrganizationRating))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm dark:shadow-dark p-6">
          <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            {editingReview ? 'Edit Your Review' : 'Write Your Review'}
          </h3>

          <div className="space-y-4 text-[var(--color-text-primary)]">
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
                className="w-full px-3 py-2 border border-[var(--color-input-border)] bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:border-[var(--color-input-focus)]"
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
                className="rounded border-[var(--color-input-border)] text-[var(--color-button-primary)] focus:ring-[var(--color-input-focus-ring)]"
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
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Reviews</h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4 shadow-sm">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-lg border border-dashed border-[var(--color-border)]">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          (() => {
            const displayedReviews = [...reviews];
            if (myReview && !reviews.some(r => r.id === myReview.id)) {
              displayedReviews.unshift(myReview);
            }
            const totalPages = Math.ceil(displayedReviews.length / PAGE_SIZE);
            const paginatedReviews = displayedReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

            return (
              <>
                {paginatedReviews.map(review => {
                  const isOwnReview = review.userId === currentUserId;
                  const initials = review.anonymous ? 'A' : (review.user?.name ? review.user.name[0].toUpperCase() : 'U');
                  const avatarBg = review.anonymous 
                    ? 'bg-slate-500/10 border border-slate-500/20 text-slate-500' 
                    : isOwnReview
                      ? 'bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)]'
                      : 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)]';

                  return (
                    <div key={review.id} className={`rounded-2xl border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 ${isOwnReview ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.02] dark:bg-[var(--color-primary)]/[0.04]' : 'border-[var(--color-border-light)] bg-[var(--color-card)]'}`}>
                      {/* Avatar Circle */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${avatarBg}`}>
                        {initials}
                      </div>

                      {/* Content Area */}
                      <div className="flex-grow min-w-0 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[15px] sm:text-base text-[var(--color-text-primary)] leading-tight">
                                {review.anonymous ? 'Anonymous Student' : review.user?.name || 'User'}
                              </span>
                              {isOwnReview && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded border border-[var(--color-primary)]/20">
                                  Your review
                                </span>
                              )}
                            </div>
                            {!review.anonymous && review.user?.department && (
                              <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-0.5">
                                {review.user.department}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex flex-col items-start sm:items-end">
                              {renderStars(review.rating)}
                              <span className="text-[11px] text-[var(--color-text-muted)] font-medium mt-1" suppressHydrationWarning>
                                {formatDistanceToNow(new Date(review.createdAt))}
                              </span>
                            </div>
                            {/* Edit/Delete buttons */}
                            {(isOwnReview || isAdmin) && (
                              <div className="flex gap-1 border-l border-[var(--color-border-light)] pl-3 ml-1">
                                {isOwnReview && (
                                  <button
                                    onClick={() => handleEditReview(review)}
                                    className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors border border-[var(--color-border-light)]/40 bg-[var(--color-surface)] shadow-sm"
                                    title="Edit review"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-[var(--color-border-light)]/40 bg-[var(--color-surface)] shadow-sm"
                                  title="Delete review"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {review.review && (
                          <div className="space-y-1.5">
                            <p className={`text-sm sm:text-[14.5px] text-[var(--color-text-secondary)] font-medium leading-relaxed bg-[var(--color-surface)]/40 p-3.5 rounded-xl border border-[var(--color-border-light)]/40 ${!expandedReviews[review.id] ? 'line-clamp-4' : ''}`}>
                              "{review.review}"
                            </p>
                            {review.review.length > 200 && (
                              <button
                                onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                className="text-xs font-bold text-[var(--color-primary)] hover:underline ml-1"
                              >
                                {expandedReviews[review.id] ? 'Read less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        )}

                        {(review.contentRating || review.speakerRating || review.organizationRating) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {review.contentRating && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)]/80 text-xs font-semibold text-[var(--color-text-muted)] shadow-sm">
                                <span className="text-[var(--color-text-secondary)] font-bold">Content:</span> {review.contentRating}/5
                              </span>
                            )}
                            {review.speakerRating && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)]/80 text-xs font-semibold text-[var(--color-text-muted)] shadow-sm">
                                <span className="text-[var(--color-text-secondary)] font-bold">Speaker:</span> {review.speakerRating}/5
                              </span>
                            )}
                            {review.organizationRating && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)]/80 text-xs font-semibold text-[var(--color-text-muted)] shadow-sm">
                                <span className="text-[var(--color-text-secondary)] font-bold">Organization:</span> {review.organizationRating}/5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}

