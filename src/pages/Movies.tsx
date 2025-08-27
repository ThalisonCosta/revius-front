import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MediaCard } from "@/components/MediaCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp, Calendar, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Genre?: string;
  imdbRating?: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Runtime?: string;
}

const OMDB_API_KEY = "47861d5a";

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const { toast } = useToast();
  
  // Debounce search query for 3 seconds
  const debouncedSearchQuery = useDebounce(searchQuery, 3000);

  // Helper function to fetch detailed movie info
  const fetchMovieDetails = async (imdbID: string): Promise<Movie | null> => {
    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`);
      const data = await response.json();
      
      if (data.Response === "True") {
        return {
          imdbID: data.imdbID,
          Title: data.Title,
          Year: data.Year,
          Poster: data.Poster,
          Genre: data.Genre,
          imdbRating: data.imdbRating,
          Plot: data.Plot,
          Director: data.Director,
          Actors: data.Actors,
          Runtime: data.Runtime
        };
      }
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
    return null;
  };

  // Real OMDB API call with improved content discovery
  const searchMovies = async (query: string, page: number = 1, loadMore: boolean = false) => {
    setLoading(true);
    try {
      const popularQueries = ["marvel", "star", "action", "comedy", "drama", "adventure", "thriller"];
      let url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&page=${page}&type=movie`;
      
      if (query.trim()) {
        url += `&s=${encodeURIComponent(query)}`;
      } else {
        // Use rotating popular searches for better content discovery
        const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
        url += `&s=${randomQuery}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.Response === "True") {
        // Fetch detailed information for each movie
        const moviePromises = (data.Search || []).map((movie: any) => 
          fetchMovieDetails(movie.imdbID)
        );
        
        const detailedMovies = await Promise.all(moviePromises);
        const validMovies = detailedMovies.filter((movie): movie is Movie => movie !== null);
        
        // Sort by IMDb rating (most popular first)
        const sortedMovies = validMovies.sort((a, b) => {
          const ratingA = parseFloat(a.imdbRating || '0');
          const ratingB = parseFloat(b.imdbRating || '0');
          return ratingB - ratingA;
        });
        
        if (loadMore) {
          setMovies(prev => [...prev, ...sortedMovies]);
        } else {
          setMovies(sortedMovies);
        }
        setTotalResults(parseInt(data.totalResults) || 0);
      } else {
        if (!loadMore) {
          setMovies([]);
          setTotalResults(0);
        }
        if (data.Error !== "Movie not found!" && !loadMore) {
          toast({
            title: "Search failed",
            description: data.Error || "Please try again later.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      if (!loadMore) {
        toast({
          title: "Error fetching movies",
          description: "Please try again later.",
          variant: "destructive"
        });
        setMovies([]);
        setTotalResults(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial popular movies
  useEffect(() => {
    searchMovies("", 1);
  }, []);

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return;
    setCurrentPage(1);
    searchMovies(debouncedSearchQuery, 1);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchMovies(searchQuery, 1);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    searchMovies(debouncedSearchQuery || "", nextPage, true);
  };

  const handleFilterClick = (filterQuery: string) => {
    setSearchQuery(filterQuery);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-primary bg-clip-text text-transparent">Movies</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover and review the latest movies from around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search movies..."
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
              onClick={() => handleFilterClick("popular")}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Popular
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleFilterClick("action")}
            >
              <Filter className="h-3 w-3 mr-1" />
              Action
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
              onClick={() => handleFilterClick("drama")}
            >
              <Filter className="h-3 w-3 mr-1" />
              Drama
            </Badge>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MediaCard
              key={movie.imdbID}
              title={movie.Title}
              poster={movie.Poster}
              year={parseInt(movie.Year)}
              rating={movie.imdbRating ? parseFloat(movie.imdbRating) : undefined}
              genre={movie.Genre?.split(", ")}
              type="movie"
              synopsis={movie.Plot}
              runtime={movie.Runtime ? parseInt(movie.Runtime) : undefined}
              cast={movie.Actors?.split(", ")}
            />
          ))}
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

        {/* Results count */}
        {!loading && totalResults > 0 && (
          <div className="text-center mb-4">
            <p className="text-muted-foreground">
              Found {totalResults.toLocaleString()} movies {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && movies.length > 0 && movies.length >= 10 && (
          <div className="flex justify-center mt-12">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-smooth"
            >
              Load More Movies
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}