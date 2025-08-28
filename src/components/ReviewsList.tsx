import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/ReviewCard";
import { Star, MessageSquare, ThumbsUp, ExternalLink } from "lucide-react";
import { useMediaReviews } from "@/hooks/useMediaReviews";
import { useExternalReviews, ExternalReview } from "@/hooks/useExternalReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

interface ReviewsListProps {
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
}

export function ReviewsList({ mediaId, mediaType, mediaTitle }: ReviewsListProps) {
  const [searchParams] = useSearchParams();
  const highlightReviewId = searchParams.get('highlightReview');
  
  const { reviews: mediaReviews, loading: reviewsLoading } = useMediaReviews(mediaId, mediaTitle);
  const { reviews: externalReviews, loading: externalLoading, fetchExternalReviews } = useExternalReviews();
  const { user } = useAuth();
  const { toast } = useToast();

  // Sort reviews to prioritize highlighted review
  const sortedReviews = highlightReviewId 
    ? mediaReviews.sort((a, b) => {
        if (a.id === highlightReviewId) return -1;
        if (b.id === highlightReviewId) return 1;
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      })
    : mediaReviews;
  
  useEffect(() => {
    fetchExternalReviews(mediaId, mediaType);
  }, [mediaId, mediaType, fetchExternalReviews]);


  const handleUnauthenticatedReview = () => {
    toast({
      title: "Create an Account",
      description: "Please create an account to write reviews",
      variant: "default",
    });
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
            {sortedReviews.length}
          </Badge>
        </div>

        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedReviews.length > 0 ? (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <div key={review.id} className={highlightReviewId === review.id ? 'ring-2 ring-primary rounded-lg' : ''}>
                <ReviewCard
                  id={review.id}
                  rating={review.rating}
                  review_text={review.review_text}
                  contains_spoilers={review.contains_spoilers}
                  created_at={review.created_at}
                  helpful_votes={review.helpful_votes}
                  user={review.user}
                  showUserInfo={true}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No one has reviewed this yet!</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to share your thoughts about "{mediaTitle}" and help others discover it.
              </p>
              {user ? (
                <p className="text-xs text-muted-foreground mb-4">
                  Your review could be the one that helps someone decide what to watch next!
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">
                  Create an account to write reviews and join our community of media enthusiasts.
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={user ? undefined : handleUnauthenticatedReview}
              >
                {user ? "Write the First Review" : "Create Account & Review"}
              </Button>
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