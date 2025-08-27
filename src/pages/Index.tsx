import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/HeroSection";
import { MediaCard } from "@/components/MediaCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { TrendingUp, Film, Tv, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import GoogleAds from "@/components/GoogleAds";

const OMDB_API_KEY = "47861d5a";

interface TrendingItem {
  id: string;
  title: string;
  poster: string;
  year: number;
  rating: number;
  genre: string[];
  type: "movie" | "tv" | "anime" | "manga";
}

const Index = () => {
  const [trendingContent, setTrendingContent] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch trending content from all APIs
  const fetchTrendingContent = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        // Fetch recommended anime
        fetch('https://api.jikan.moe/v4/recommendations/anime?page=1'),
        // Fetch recommended manga
        fetch('https://api.jikan.moe/v4/recommendations/manga?page=1'),
        // Fetch popular TV shows from TVMaze
        fetch('https://api.tvmaze.com/shows?page=0'),
        // Fetch popular movies from OMDB (using different search terms for variety)
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=marvel&type=movie&page=1`)
      ]);

      const trendingItems: TrendingItem[] = [];

      // Process recommended anime
      if (results[0].status === 'fulfilled') {
        const animeData = await results[0].value.json();
        if (animeData.data && Array.isArray(animeData.data)) {
          const animeRecommendations = animeData.data.flatMap((rec: any) => {
            const entries = rec.entry || [];
            return entries.slice(0, 2).map((entry: any) => ({
              id: `anime-${entry.mal_id}`,
              title: entry.title,
              poster: entry.images?.jpg?.image_url || "",
              year: entry.year || new Date().getFullYear(),
              rating: entry.score || 8.0,
              genre: entry.genres ? entry.genres.map((g: any) => g.name).slice(0, 3) : ["Anime"],
              type: "anime" as const
            }));
          }).slice(0, 5);
          trendingItems.push(...animeRecommendations);
        }
      }

      // Process recommended manga
      if (results[1].status === 'fulfilled') {
        const mangaData = await results[1].value.json();
        if (mangaData.data && Array.isArray(mangaData.data)) {
          const mangaRecommendations = mangaData.data.flatMap((rec: any) => {
            const entries = rec.entry || [];
            return entries.slice(0, 2).map((entry: any) => ({
              id: `manga-${entry.mal_id}`,
              title: entry.title,
              poster: entry.images?.jpg?.image_url || "",
              year: entry.published?.from ? new Date(entry.published.from).getFullYear() : new Date().getFullYear(),
              rating: entry.score || 8.0,
              genre: entry.genres ? entry.genres.map((g: any) => g.name).slice(0, 3) : ["Manga"],
              type: "manga" as const
            }));
          }).slice(0, 5);
          trendingItems.push(...mangaRecommendations);
        }
      }

      // Process TV shows (take top-rated ones)
      if (results[2].status === 'fulfilled') {
        const showsData = await results[2].value.json();
        if (Array.isArray(showsData)) {
          const filteredShows = showsData
            .filter((show: any) => show.rating?.average && show.rating.average > 7.5)
            .sort((a: any, b: any) => (b.rating?.average || 0) - (a.rating?.average || 0))
            .slice(0, 5);
          
          const shows = filteredShows.map((show: any) => ({
            id: `tv-${show.id}`,
            title: show.name,
            poster: show.image?.medium || "",
            year: show.premiered ? new Date(show.premiered).getFullYear() : new Date().getFullYear(),
            rating: show.rating?.average || 8.0,
            genre: show.genres?.slice(0, 3) || ["Drama"],
            type: "tv" as const
          }));
          trendingItems.push(...shows);
        }
      }

      // Process movies
      if (results[3].status === 'fulfilled') {
        const moviesData = await results[3].value.json();
        if (moviesData.Response === "True" && moviesData.Search) {
          const movies = moviesData.Search.slice(0, 5).map((movie: any, index: number) => ({
            id: `movie-${movie.imdbID}`,
            title: movie.Title,
            poster: movie.Poster !== "N/A" ? movie.Poster : "",
            year: parseInt(movie.Year) || new Date().getFullYear(),
            rating: 8.0 + (index * 0.1), // Mock rating with some variation
            genre: ["Action", "Adventure"], // OMDB search doesn't provide detailed genre info
            type: "movie" as const
          }));
          trendingItems.push(...movies);
        }
      }

      // Shuffle array to mix different media types
      const shuffledItems = trendingItems.sort(() => Math.random() - 0.5);
      setTrendingContent(shuffledItems);
    } catch (error) {
      console.error("Error fetching trending content:", error);
      toast({
        title: "Error loading trending content",
        description: "Some content may not be available.",
        variant: "destructive"
      });
      
      // Fallback data
      const fallbackData: TrendingItem[] = [
        {
          id: "fallback-1",
          title: "Popular Anime",
          poster: "",
          year: new Date().getFullYear(),
          rating: 8.5,
          genre: ["Action"],
          type: "anime"
        },
        {
          id: "fallback-2",
          title: "Popular Manga",
          poster: "",
          year: new Date().getFullYear(),
          rating: 8.3,
          genre: ["Adventure"],
          type: "manga"
        },
        {
          id: "fallback-3",
          title: "Popular Show",
          poster: "",
          year: new Date().getFullYear(),
          rating: 8.7,
          genre: ["Drama"],
          type: "tv"
        },
        {
          id: "fallback-4",
          title: "Popular Movie",
          poster: "",
          year: new Date().getFullYear(),
          rating: 8.2,
          genre: ["Action"],
          type: "movie"
        }
      ];
      setTrendingContent(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingContent();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      
      <main className="container mx-auto px-4 py-16">
        {/* Trending Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <TrendingUp className="inline-block h-8 w-8 mr-3 text-primary" />
              Trending Now
            </h2>
            <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-smooth" asChild>
              <Link to="/movies">View All</Link>
            </Button>
          </div>

          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                    <div className="animate-pulse">
                      <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                trendingContent.map((item) => (
                  <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                    <MediaCard
                      title={item.title}
                      poster={item.poster}
                      year={item.year}
                      rating={item.rating}
                      genre={item.genre}
                      type={item.type}
                    />
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </section>

        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/movies">
              <Card className="group cursor-pointer transition-smooth hover:shadow-card hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Film className="h-6 w-6 text-primary" />
                    <span>Movies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Discover blockbusters, indie films, and cinema classics</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tv-shows">
              <Card className="group cursor-pointer transition-smooth hover:shadow-card hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Tv className="h-6 w-6 text-primary" />
                    <span>TV Shows</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Binge-worthy series from around the world</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/anime">
              <Card className="group cursor-pointer transition-smooth hover:shadow-card hover:scale-[1.02]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span>Anime & Manga</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Japanese animation and manga series</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-card/30 rounded-2xl p-8 border border-border/50">
          <h2 className="text-3xl font-bold text-center mb-8">Join the Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2M+</div>
              <div className="text-muted-foreground">Movies & Shows</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500K+</div>
              <div className="text-muted-foreground">Reviews Written</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
