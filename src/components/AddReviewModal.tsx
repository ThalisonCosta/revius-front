import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Plus } from "lucide-react";
import { useUserReviews } from "@/hooks/useUserReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddReviewModalProps {
  mediaId?: string;
  mediaTitle?: string;
  mediaType?: string;
  children?: React.ReactNode;
}

export function AddReviewModal({ mediaId, mediaTitle, mediaType, children }: AddReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [customMediaTitle, setCustomMediaTitle] = useState(mediaTitle || "");
  const [customMediaType, setCustomMediaType] = useState(mediaType || "movie");
  const [submitting, setSubmitting] = useState(false);
  
  const { createReview } = useUserReviews();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    console.log("Form submission started");
    console.log("User:", user);
    console.log("Rating:", rating);
    console.log("MediaId:", mediaId);
    console.log("CustomMediaTitle:", customMediaTitle);
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to write a review.",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    // Validate title for custom media
    if (!mediaId && !customMediaTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a media title.",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    try {
      // First, ensure media exists in the database
      let finalMediaId = mediaId;
      
      if (!mediaId) {
        // Create media entry for custom reviews
        const mediaSlug = `${customMediaType}-${customMediaTitle.replace(/\s+/g, '-').toLowerCase()}`;
        finalMediaId = mediaSlug;
        
        console.log("Creating media entry with ID:", finalMediaId);
        
        // Insert media entry
        const { error: mediaError } = await supabase
          .from('media')
          .upsert({
            id: finalMediaId,
            title: customMediaTitle,
            type: customMediaType as any,
            slug: mediaSlug,
            added_by: user.id,
          }, { onConflict: 'id' });
          
        if (mediaError) {
          console.error('Error creating media:', mediaError);
          throw mediaError;
        }
      }
      
      console.log("Creating review with final media ID:", finalMediaId);
      
      await createReview({
        media_id: finalMediaId,
        rating,
        review_text: reviewText.trim() || null,
        contains_spoilers: containsSpoilers,
      });

      // Reset form
      setRating(0);
      setReviewText("");
      setContainsSpoilers(false);
      setCustomMediaTitle("");
      setCustomMediaType("movie");
      setOpen(false);

    } catch (error) {
      console.error("Failed to create review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="shadow-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Info */}
          {!mediaId && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Media Title</Label>
                <Input
                  id="title"
                  value={customMediaTitle}
                  onChange={(e) => setCustomMediaTitle(e.target.value)}
                  placeholder="Enter movie/show title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={customMediaType}
                  onChange={(e) => setCustomMediaType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                  <option value="anime">Anime</option>
                  <option value="manga">Manga</option>
                </select>
              </div>
            </div>
          )}

          {/* Rating */}
          <div>
            <Label>Rating *</Label>
            <div className="flex items-center space-x-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="p-0 bg-transparent border-none focus:outline-none"
                  onMouseEnter={() => setHoveredRating(i + 1)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(i + 1)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      (hoveredRating || rating) > i
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 && `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this title..."
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Spoilers Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spoilers"
              checked={containsSpoilers}
              onCheckedChange={(checked) => setContainsSpoilers(checked === true)}
            />
            <Label htmlFor="spoilers" className="text-sm">
              This review contains spoilers
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="shadow-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}