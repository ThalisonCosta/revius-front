import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, Calendar, Users, Clock } from "lucide-react";
import { ReviewsList } from "./ReviewsList";
import { AddReviewModal } from "./AddReviewModal";
import { useAuth } from "@/contexts/AuthContext";

interface MediaDetailsModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  media: {
    id: string;
    title: string;
    type: string;
    poster?: string;
    year?: number;
    rating?: number;
    genres?: string[];
    synopsis?: string;
    runtime?: number;
    cast?: string[];
    externalUrl?: string;
  };
}

export function MediaDetailsModal({ isOpen, onClose, media }: MediaDetailsModalProps) {
  const { user } = useAuth();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{media.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Poster */}
          <div className="md:col-span-1">
            {media.poster ? (
              <img
                src={media.poster}
                alt={media.title}
                className="w-full h-auto rounded-lg shadow-card"
              />
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No poster available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="secondary" className="capitalize">
                {media.type}
              </Badge>
              {media.cast && media.cast.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {media.cast.join(", ")}
                </div>
              )}

              
              {media.year && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {media.year}
                </div>
              )}
              {media.runtime && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {media.runtime} min
                </div>
              )}
              {media.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{media.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {media.genres && media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {media.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {media.synopsis && (
              <div>
                <h3 className="font-semibold mb-2">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {media.synopsis}
                </p>
              </div>
            )}

            {/* Cast */}
            {media.cast && media.cast.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {media.cast.slice(0, 8).map((actor, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {actor}
                    </Badge>
                  ))}
                  {media.cast.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{media.cast.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {user && (
                <AddReviewModal 
                  mediaId={media.id} 
                  mediaTitle={media.title} 
                  mediaType={media.type}
                >
                  <Button className="shadow-primary">
                    <Star className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                </AddReviewModal>
              )}
              {media.externalUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(media.externalUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  More Info
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewsList 
            mediaId={media.id}
            mediaType={media.type}
            mediaTitle={media.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}