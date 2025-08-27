import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';

interface EditReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: {
    id: string;
    rating: number;
    review_text: string | null;
    contains_spoilers: boolean | null;
    media?: {
      title: string;
    };
  } | null;
  onSave: (reviewId: string, updates: { rating: number; review_text?: string; contains_spoilers?: boolean }) => Promise<any>;
}

export const EditReviewModal = ({ open, onOpenChange, review, onSave }: EditReviewModalProps) => {
  const [formData, setFormData] = useState({
    rating: review?.rating || 5,
    review_text: review?.review_text || '',
    contains_spoilers: review?.contains_spoilers ?? false
  });

  const handleSave = async () => {
    if (!review) return;
    
    await onSave(review.id, formData);
    onOpenChange(false);
  };

  // Reset form when review changes
  useEffect(() => {
    if (review) {
      setFormData({
        rating: review.rating,
        review_text: review.review_text || '',
        contains_spoilers: review.contains_spoilers ?? false
      });
    }
  }, [review]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Review{review?.media?.title && ` for "${review.media.title}"`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= formData.rating
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editReviewText">Review (optional)</Label>
            <Textarea
              id="editReviewText"
              value={formData.review_text}
              onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              placeholder="Share your thoughts..."
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="editReviewSpoilers"
              checked={formData.contains_spoilers}
              onCheckedChange={(checked) => setFormData({ ...formData, contains_spoilers: checked })}
            />
            <Label htmlFor="editReviewSpoilers">Contains spoilers</Label>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="shadow-primary"
            >
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};