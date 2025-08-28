import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, Calendar, Clock, Plus, ArrowLeft, ChevronRight, Home } from "lucide-react";
import { ReviewsList } from "@/components/ReviewsList";
import { AddReviewModal } from "@/components/AddReviewModal";
import { AddToListModal } from "@/components/AddToListModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MediaData {
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
}

export default function MediaDetails() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaData | null>(null);
  const [reviewsKey, setReviewsKey] = useState(0);

  const handleReviewCreated = useCallback(() => {
    setReviewsKey(prev => prev + 1);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleUnauthenticatedAction = (action: string) => {
    toast({
      title: "Create an Account",
      description: `Please create an account to ${action}`,
      variant: "default",
    });
  };

  // Helper function to get the route path based on media type
  const getMediaRoutePath = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return '/movies';
      case 'tv':
        return '/tv-shows';
      case 'anime':
      case 'manga':
        return '/anime';
      default:
        return '/';
    }
  };

  // Helper function to get the page name based on media type
  const getPageName = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return 'Movies';
      case 'tv':
        return 'TV Shows';
      case 'anime':
        return 'Anime';
      case 'manga':
        return 'Manga';
      default:
        return 'Home';
    }
  };

  useEffect(() => {
    if (!type || !id) return;

    const initializeMedia = async () => {
      // Parse media data from URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      
      const mediaInfo = {
        title: decodeURIComponent(searchParams.get('title') || 'Unknown Title'),
        type: type,
        poster: searchParams.get('poster') || undefined,
        year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
        rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
        genres: searchParams.get('genres') ? searchParams.get('genres')!.split(',') : undefined,
        synopsis: searchParams.get('synopsis') ? decodeURIComponent(searchParams.get('synopsis')!) : undefined,
        runtime: searchParams.get('runtime') ? parseInt(searchParams.get('runtime')!) : undefined,
        cast: searchParams.get('cast') ? searchParams.get('cast')!.split(',') : undefined,
        externalUrl: searchParams.get('externalUrl') || undefined
      };

      // Set the media data for display
      const mediaData: MediaData = {
        id: id,
        ...mediaInfo
      };
      setMedia(mediaData);
    };

    initializeMedia();
  }, [type, id]);

  if (!media) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link 
            to={getMediaRoutePath(media?.type || '')} 
            className="hover:text-primary transition-colors"
          >
            {getPageName(media?.type || '')}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-xs">
            {media?.title || 'Loading...'}
          </span>
        </nav>

        {/* Media Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* Poster */}
          <div className="lg:col-span-1">
            <div className="mx-auto max-w-sm lg:max-w-none">
              {media.poster ? (
                <img
                  src={media.poster}
                  alt={media.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">No poster available</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-4">{media.title}</h1>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                <Badge variant="secondary" className="capitalize">
                  {media.type}
                </Badge>
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
                <h3 className="font-semibold mb-2 text-lg">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {media.synopsis}
                </p>
              </div>
            )}

            {/* Cast */}
            {media.cast && media.cast.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-lg">Cast</h3>
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
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <AddReviewModal 
                    mediaId={media.id} 
                    mediaTitle={media.title} 
                    mediaType={media.type}
                    onReviewCreated={handleReviewCreated}
                  >
                    <Button className="shadow-primary">
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  </AddReviewModal>
                  <AddToListModal
                    mediaId={media.id}
                    mediaTitle={media.title}
                    mediaType={media.type}
                    mediaPoster={media.poster}
                  >
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to List
                    </Button>
                  </AddToListModal>
                </>
              ) : (
                <>
                  <Button 
                    className="shadow-primary"
                    onClick={() => handleUnauthenticatedAction("write reviews")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleUnauthenticatedAction("add media to lists")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to List
                  </Button>
                </>
              )}
              {media.externalUrl && (
                <Button 
                  variant="outline" 
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
        <div className="mt-12">
          <ReviewsList 
            key={`reviews-${media.id}-${reviewsKey}`}
            mediaId={media.id}
            mediaType={media.type}
            mediaTitle={media.title}
          />
        </div>
      </main>
    </div>
  );
}