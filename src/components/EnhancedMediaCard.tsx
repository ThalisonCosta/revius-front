import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, BookOpen, Film, Tv, Drama, Gamepad2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useMediaDetails } from "@/hooks/useMediaDetails";

interface EnhancedMediaCardProps {
  title: string;
  poster?: string;
  year?: number;
  type: "movie" | "tv" | "novela" | "anime" | "manga" | "game";
  className?: string;
  id?: string;
  synopsis?: string;
  externalId?: string;
  apiSource?: string;
  showEnhancedDetails?: boolean; // Whether to fetch and show enhanced details
}

const typeIcons = {
  movie: Film,
  tv: Tv,
  novela: Drama,
  anime: BookOpen,
  manga: BookOpen,
  game: Gamepad2
};

export function EnhancedMediaCard({ 
  title, 
  poster, 
  year, 
  type,
  className,
  id,
  synopsis,
  externalId,
  apiSource,
  showEnhancedDetails = true
}: EnhancedMediaCardProps) {
  const TypeIcon = typeIcons[type] || Film;
  const navigate = useNavigate();
  
  // Fetch enhanced details if external ID and API source are available
  const { details, loading } = useMediaDetails(
    showEnhancedDetails ? externalId : null, 
    showEnhancedDetails ? apiSource : null,
    { enabled: showEnhancedDetails && !!externalId && !!apiSource }
  );
  
  const mediaId = id || `${type}-${title.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Use enhanced details if available, fallback to basic data
  const displayData = useMemo(() => ({
    title: details?.title || title,
    poster: details?.poster_path || poster,
    year: details?.release_date ? new Date(details.release_date).getFullYear() : year,
    rating: details?.vote_average || details?.imdb_rating ? parseFloat(details.imdb_rating || '0') : details?.mal_score,
    genres: details?.genres?.map(g => g.name) || [],
    synopsis: details?.overview || synopsis,
    runtime: details?.runtime,
    cast: details?.cast?.slice(0, 3).map(c => c.name) || [],
    externalUrl: details?.external_urls?.tmdb || details?.external_urls?.imdb || details?.external_urls?.mal
  }), [details, title, poster, year, synopsis]);

  const handleNavigateToDetails = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const params = new URLSearchParams();
    params.set('title', encodeURIComponent(displayData.title));
    if (displayData.poster) params.set('poster', displayData.poster);
    if (displayData.year) params.set('year', displayData.year.toString());
    if (displayData.rating) params.set('rating', displayData.rating.toString());
    if (displayData.genres.length > 0) params.set('genres', displayData.genres.join(','));
    if (displayData.synopsis) params.set('synopsis', encodeURIComponent(displayData.synopsis));
    if (displayData.runtime) params.set('runtime', displayData.runtime.toString());
    if (displayData.cast.length > 0) params.set('cast', displayData.cast.join(','));
    if (displayData.externalUrl) params.set('externalUrl', displayData.externalUrl);
    if (externalId) params.set('externalId', externalId);
    if (apiSource) params.set('apiSource', apiSource);
    
    navigate(`/media/${type}/${encodeURIComponent(mediaId)}?${params.toString()}`);
  }, [navigate, type, mediaId, displayData, externalId, apiSource]);

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-smooth hover:shadow-card hover:scale-[1.02] cursor-pointer",
        "bg-card/50 border-border/50 hover:border-primary/20",
        className
      )}
      onClick={handleNavigateToDetails}
    >
      <CardContent className="p-0">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {loading && !displayData.poster ? (
            <Skeleton className="w-full h-full" />
          ) : displayData.poster ? (
            <img
              src={displayData.poster}
              alt={displayData.title}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <TypeIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Rating badge */}
          {displayData.rating && (
            <div className="absolute top-2 right-2 bg-black/80 rounded-md px-2 py-1 flex items-center space-x-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-xs font-medium text-white">
                {typeof displayData.rating === 'number' ? displayData.rating.toFixed(1) : displayData.rating}
              </span>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs capitalize bg-primary/20 text-primary border-primary/30">
              {type}
            </Badge>
          </div>

          {/* Runtime badge */}
          {displayData.runtime && (
            <div className="absolute bottom-2 left-2 bg-black/80 rounded-md px-2 py-1 flex items-center space-x-1">
              <Clock className="h-3 w-3 text-white" />
              <span className="text-xs font-medium text-white">
                {formatRuntime(displayData.runtime)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
            {displayData.title}
          </h3>
          
          <div className="space-y-2">
            {/* Year and Genres */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {displayData.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{displayData.year}</span>
                </div>
              )}
              {displayData.genres.length > 0 && (
                <span className="line-clamp-1">{displayData.genres.slice(0, 2).join(", ")}</span>
              )}
            </div>

            {/* Enhanced details loading state */}
            {loading && showEnhancedDetails && (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            )}

            {/* Cast preview */}
            {displayData.cast.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Elenco: </span>
                <span className="line-clamp-1">{displayData.cast.join(", ")}</span>
              </div>
            )}

            {/* Genres as badges for enhanced view */}
            {displayData.genres.length > 0 && showEnhancedDetails && !loading && (
              <div className="flex flex-wrap gap-1">
                {displayData.genres.slice(0, 3).map((genre, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-1 py-0.5 h-5"
                  >
                    {genre}
                  </Badge>
                ))}
                {displayData.genres.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0.5 h-5">
                    +{displayData.genres.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}