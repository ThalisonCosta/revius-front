import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddReviewModal } from "@/components/AddReviewModal";
import { MediaDetailsModal } from "@/components/MediaDetailsModal";
import { useState } from "react";

interface MediaCardProps {
  title: string;
  poster?: string;
  year?: number;
  rating?: number;
  genre?: string[];
  type: "movie" | "tv" | "anime" | "manga" | "game";
  className?: string;
  id?: string;
  synopsis?: string;
  runtime?: number;
  cast?: string[];
  externalUrl?: string;
}

const typeIcons = {
  movie: Film,
  tv: Tv,
  anime: BookOpen,
  manga: BookOpen,
  game: Gamepad2
};

export function MediaCard({ 
  title, 
  poster, 
  year, 
  rating, 
  genre = [], 
  type,
  className,
  id,
  synopsis,
  runtime,
  cast,
  externalUrl
}: MediaCardProps) {
  const TypeIcon = typeIcons[type] || Film;
  const [showDetails, setShowDetails] = useState(false);
  
  const mediaId = id || `${type}-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const handleOpenDetails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log('Opening details for:', { title, type, mediaId });
    setShowDetails(true);
  };

  const handleModalChange = (open: boolean) => {
    console.log('Modal state change for:', { title, type, mediaId, open });
    setShowDetails(open);
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-smooth hover:shadow-card hover:scale-[1.02] cursor-pointer",
        "bg-card/50 border-border/50 hover:border-primary/20",
        className
      )}
      onClick={handleOpenDetails}
    >
      <CardContent className="p-0">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <TypeIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Rating badge */}
          {rating && (
            <div className="absolute top-2 right-2 bg-black/80 rounded-md px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs capitalize bg-primary/20 text-primary border-primary/30">
              {type}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{year}</span>
            {genre.length > 0 && (
              <span className="line-clamp-1">{genre.slice(0, 2).join(", ")}</span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Media Details Modal */}
      <MediaDetailsModal
        isOpen={showDetails}
        onClose={handleModalChange}
        media={{
          id: mediaId,
          title,
          type,
          poster,
          year,
          rating,
          genres: genre,
          synopsis,
          runtime,
          cast,
          externalUrl,
        }}
      />
    </Card>
  );
}

// Import missing icons
import { Film, Tv, Gamepad2 } from "lucide-react";