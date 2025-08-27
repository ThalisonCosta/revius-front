import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, BookOpen, Eye, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { MediaDetailsModal } from "@/components/MediaDetailsModal";

interface BlurredMediaCardProps {
  title: string;
  poster?: string;
  year?: number;
  rating?: number;
  genre?: string[];
  type: "movie" | "tv" | "anime" | "manga" | "game";
  className?: string;
  isAdult?: boolean;
  isBlurred?: boolean;
  synopsis?: string;
  runtime?: number;
  cast?: string[];
}

const typeIcons = {
  movie: Plus, // Film icon not imported yet
  tv: Plus, // Tv icon not imported yet
  anime: BookOpen,
  manga: BookOpen,
  game: Plus // Gamepad2 icon not imported yet
};

export function BlurredMediaCard({ 
  title, 
  poster, 
  year, 
  rating, 
  genre = [], 
  type,
  className,
  isAdult = false,
  isBlurred = false,
  synopsis,
  runtime,
  cast
}: BlurredMediaCardProps) {
  const [showContent, setShowContent] = useState(!isBlurred);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const TypeIcon = typeIcons[type] || Plus;

  const handleRevealContent = () => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }
    setShowContent(true);
  };

  const handleOpenDetails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!showContent) return; // Don't open modal if content is blurred
    setShowDetails(true);
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
              className={cn(
                "w-full h-full object-cover transition-smooth group-hover:scale-105",
                !showContent && "blur-xl"
              )}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <TypeIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Adult Content Overlay */}
          {!showContent && isAdult && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-3">
              <Shield className="h-8 w-8 text-red-400" />
              <div className="text-center px-4">
                <h4 className="text-white font-medium text-sm mb-1">Mature Content</h4>
                <p className="text-white/80 text-xs mb-3">
                  This content may not be suitable for all audiences
                </p>
                {user ? (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={handleRevealContent}
                    className="shadow-primary"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Show Content
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="shadow-primary"
                    asChild
                  >
                    <Link to="/login">
                      <Eye className="h-4 w-4 mr-1" />
                      Login to View
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}


          {/* Rating badge */}
          {rating && showContent && (
            <div className="absolute top-2 right-2 bg-black/80 rounded-md px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs capitalize bg-primary/20 text-primary border-primary/30">
              {type}
              {isAdult && (
                <>
                  <AlertTriangle className="h-3 w-3 ml-1 text-red-400" />
                </>
              )}
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
            {genre.length > 0 && showContent && (
              <span className="line-clamp-1">{genre.slice(0, 2).join(", ")}</span>
            )}
            {isAdult && !showContent && (
              <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">
                18+
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Media Details Modal */}
      <MediaDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        media={{
          id: `${type}-${title.replace(/\s+/g, '-').toLowerCase()}`,
          title,
          type,
          poster,
          year,
          rating,
          genres: genre,
          synopsis,
          runtime,
          cast,
          externalUrl: undefined,
        }}
      />
    </Card>
  );
}