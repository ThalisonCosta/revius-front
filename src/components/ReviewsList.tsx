import { useEffect, useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare, ThumbsUp, ExternalLink } from "lucide-react";
import { useMediaReviews } from "@/hooks/useMediaReviews";
import { useExternalReviews, ExternalReview } from "@/hooks/useExternalReviews";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewsListProps {
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
}

export function ReviewsList({ mediaId, mediaType, mediaTitle }: ReviewsListProps) {
  const [editingReview, setEditingReview] = useState<string | null>(null);
  
  const { reviews: mediaReviews, loading: reviewsLoading, refetch } = useMediaReviews(mediaId);
  const { reviews: externalReviews, loading: externalLoading, fetchExternalReviews } = useExternalReviews();
  const { user } = useAuth();
  
  useEffect(() => {
    fetchExternalReviews(mediaId, mediaType);
  }, [mediaId, mediaType, fetchExternalReviews]);

  const handleEdit = (reviewId: string) => {
    setEditingReview(reviewId);
  };

  const handleDelete = async (reviewId: string) => {
    try {
      // Delete review functionality will be handled by the ReviewCard component
      refetch(); // Refresh reviews after deletion
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const ExternalReviewCard = ({ review }: { review: ExternalReview }) => (
    <Card 
      className="border-border shadow-card cursor-pointer hover:shadow-lg transition-shadow" 
      onClick={() => {
        const searchQuery = `${review.author} ${review.platform} review`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        window.open(searchUrl, '_blank');
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{review.author}</span>
            <Badge variant="outline" className="text-xs">
              {review.platform}
            </Badge>
            {review.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="text-xs font-medium">{review.rating}</span>
              </div>
            )}
          </div>
          {review.date && (
            <p className="text-xs text-muted-foreground">
              {new Date(review.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            const searchQuery = `${review.author} ${review.platform} review`;
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            window.open(searchUrl, '_blank');
          }}
          title="Search for this review online"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {review.content}
        </p>
        {review.helpful_votes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ThumbsUp className="h-3 w-3" />
            <span>{review.helpful_votes} helpful</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Revius Reviews Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Revius Reviews</h3>
        <Badge variant="secondary" className="text-xs">
            {mediaReviews.length}
          </Badge>
        </div>

        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : mediaReviews.length > 0 ? (
          <div className="space-y-4">
            {mediaReviews.map((review) => (
              <Card key={review.id} className="border-border shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.user.username}</span>
                      {review.user.is_verified && (
                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                          <Star className="h-3 w-3" />
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.created_at && new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {review.review_text}
                    </p>
                  )}
                  {review.contains_spoilers && (
                    <Badge variant="outline" className="text-xs">
                      Contains Spoilers
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No Revius reviews yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to review "{mediaTitle}"
              </p>
              {user && (
                <Button variant="outline" size="sm">
                  Write a Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* External Reviews Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Reviews from the Web</h3>
          <Badge variant="secondary" className="text-xs">
            {externalReviews.length}
          </Badge>
        </div>

        {externalLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : externalReviews.length > 0 ? (
          <div className="space-y-4">
            {externalReviews.map((review) => (
              <ExternalReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No external reviews found</h4>
              <p className="text-sm text-muted-foreground">
                External reviews for "{mediaTitle}" are not available at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}