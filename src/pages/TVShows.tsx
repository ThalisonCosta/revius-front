import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MediaCard } from "@/components/MediaCard";
import { BlurredMediaCard } from "@/components/BlurredMediaCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useContentFilter } from "@/hooks/useContentFilter";

interface TVShow {
  id: number;
  name: string;
  image?: {
    medium: string;
    original: string;
  };
  premiered?: string;
  rating?: {
    average: number;
  };
  genres: string[];
  status?: string;
  summary?: string;
}

export default function TVShows() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();
  const { isAdultContent, shouldBlurContent, shouldHideContent } = useContentFilter();
  
  // Debounce search query for 3 seconds
  const debouncedSearchQuery = useDebounce(searchQuery, 3000);

  // Fetch shows from TVMaze API with rating-based sorting and progressive loading
  const searchShows = async (query: string = "", page: number = 0, loadMore: boolean = false) => {
    setLoading(true);
    try {
      let url = "https://api.tvmaze.com/shows";
      let showsData: TVShow[] = [];
      
      if (query.trim()) {
        url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        showsData = data.map((item: any) => item.show);
      } else {
        // For better rating-sorted content, fetch multiple pages and sort by rating
        const pagesToFetch = loadMore ? 1 : 3; // Fetch 3 pages initially for better sorting
        const startPage = loadMore ? page : page * pagesToFetch;
        const promises = [];
        
        for (let i = 0; i < pagesToFetch; i++) {
          promises.push(
            fetch(`${url}?page=${startPage + i}`)
              .then(res => res.json())
              .catch(() => [])
          );
        }
        
        const results = await Promise.all(promises);
        showsData = results.flat().filter(show => show && show.id && show.rating?.average);
        
        // Sort by rating (highest rated first) for better quality content
        showsData = showsData.sort((a, b) => {
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return ratingB - ratingA;
        });
        
        // Take only top-rated shows to avoid performance issues
        showsData = showsData.slice(0, 25);
      }
      
      if (loadMore) {
        setShows(prev => [...prev, ...showsData]);
      } else {
        setShows(showsData);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
      toast({
        title: "Error fetching TV shows",
        description: "Please try again later.",
        variant: "destructive"
      });
      
      // Fallback data
      setShows([
        {
          id: 1,
          name: "Breaking Bad",
          image: {
            medium: "https://static.tvmaze.com/uploads/images/medium_portrait/0/2400.jpg",
            original: "https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg"
          },
          premiered: "2008-01-20",
          rating: { average: 9.5 },
          genres: ["Drama", "Crime", "Thriller"],
          status: "Ended",
          summary: "High school chemistry teacher Walter White's life is suddenly transformed by a dire medical diagnosis. Street-savvy former student Jesse Pinkman 'cooks' with Walter, and the duo turns to a life of crime."
        },
        {
          id: 2,
          name: "Game of Thrones",
          image: {
            medium: "https://static.tvmaze.com/uploads/images/medium_portrait/190/476117.jpg",
            original: "https://static.tvmaze.com/uploads/images/original_untouched/190/476117.jpg"
          },
          premiered: "2011-04-17",
          rating: { average: 9.0 },
          genres: ["Drama", "Adventure", "Fantasy"],
          status: "Ended",
          summary: "Based on the bestselling book series A Song of Ice and Fire by George R.R. Martin, this sprawling new HBO drama is set in a world where summers can last decades and winters a lifetime."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial shows
  useEffect(() => {
    searchShows("", 0);
  }, []);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    searchShows(debouncedSearchQuery, nextPage, true);
  };

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return;
    setCurrentPage(0);
    searchShows(debouncedSearchQuery, 0);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    searchShows(searchQuery, 0);
  };

  const handleFilterClick = (filterQuery: string) => {
    setSearchQuery(filterQuery);
    setCurrentPage(0);
    searchShows(filterQuery, 0);
  };

  const getYear = (premiered?: string) => {
    return premiered ? new Date(premiered).getFullYear() : undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-primary bg-clip-text text-transparent">TV Shows</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover series from around the world powered by TVMaze
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>

          {/* Filter badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth"
              onClick={() => { setSearchQuery(""); setCurrentPage(0); searchShows("", 0); }}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              All Shows
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleFilterClick("drama")}
            >
              <Filter className="h-3 w-3 mr-1" />
              Drama
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleFilterClick("comedy")}
            >
              <Filter className="h-3 w-3 mr-1" />
              Comedy
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleFilterClick("action")}
            >
              <Filter className="h-3 w-3 mr-1" />
              Action
            </Badge>
          </div>
        </div>

        {/* Shows Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {shows
            .filter((show) => !shouldHideContent(show))
            .map((show) => {
              const isAdult = isAdultContent(show);
              const shouldBlur = shouldBlurContent(show);
              
              if (isAdult && shouldBlur) {
                return (
                  <BlurredMediaCard
                    key={show.id}
                    title={show.name}
                    poster={show.image?.medium}
                    year={getYear(show.premiered)}
                    rating={show.rating?.average}
                    genre={show.genres}
                    type="tv"
                    synopsis={show.summary?.replace(/<[^>]*>/g, '')}
                    isAdult={true}
                    isBlurred={true}
                  />
                );
              }
              
              return (
                <MediaCard
                  key={show.id}
                  id={show.id.toString()}
                  title={show.name}
                  poster={show.image?.medium}
                  year={getYear(show.premiered)}
                  rating={show.rating?.average}
                  genre={show.genres}
                  type="tv"
                  synopsis={show.summary?.replace(/<[^>]*>/g, '')}
                  externalUrl={`https://www.tvmaze.com/shows/${show.id}`}
                />
              );
            })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && shows.length > 0 && shows.length >= 20 && (
          <div className="flex justify-center mt-12">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              Load More Series
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}