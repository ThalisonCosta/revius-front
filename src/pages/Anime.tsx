import { useState, useEffect } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MediaCard } from "@/components/MediaCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface JikanItem {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  year?: number;
  score?: number;
  genres: Array<{ name: string }>;
  status?: string;
  type?: string;
  synopsis?: string;
}

export default function Anime() {
  const [animeList, setAnimeList] = useState<JikanItem[]>([]);
  const [mangaList, setMangaList] = useState<JikanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("anime");
  const { toast } = useToast();
  
  // Debounce search query for 3 seconds
  const debouncedSearchQuery = useDebounce(searchQuery, 3000);

  // Fetch data from Jikan API with recommendations and improved content discovery
  const fetchData = async (type: "anime" | "manga", query: string = "", page: number = 1, loadMore: boolean = false) => {
    setLoading(true);
    try {
      let url = "";
      let processedData: JikanItem[] = [];
      
      if (query.trim()) {
        // Search for specific anime/manga
        url = `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&page=${page}&limit=24&sfw=true`;
        const response = await fetch(url);
        const data = await response.json();
        processedData = data.data || [];
      } else {
        // For initial load, prioritize recommendations and popular content
        const strategies = [
          `https://api.jikan.moe/v4/recommendations/${type}?page=${Math.min(page, 10)}`, // Recommendations API
          `https://api.jikan.moe/v4/top/${type}?filter=bypopularity&limit=24&page=${page}`,
          `https://api.jikan.moe/v4/top/${type}?filter=byscore&limit=24&page=${page}`,
          ...(type === "anime" ? [`https://api.jikan.moe/v4/seasons/now?limit=24&page=${page}`] : [])
        ];
        
        // Use recommendations for first page, then rotate strategies
        const strategyIndex = page === 1 ? 0 : ((page - 1) % (strategies.length - 1)) + 1;
        url = strategies[strategyIndex];
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (url.includes('recommendations')) {
          // Process recommendations API response
          if (data.data && Array.isArray(data.data)) {
            processedData = data.data.flatMap((rec: any) => {
              const entries = rec.entry || [];
              return entries.map((entry: any) => ({
                mal_id: entry.mal_id,
                title: entry.title,
                images: entry.images,
                year: entry.year || new Date().getFullYear(),
                score: entry.score || 8.0,
                genres: entry.genres || [{ name: type === "anime" ? "Anime" : "Manga" }],
                status: entry.status || "Unknown",
                type: entry.type || (type === "anime" ? "TV" : "Manga"),
                synopsis: entry.synopsis || `Recommended ${type} title.`
              }));
            }).slice(0, 24); // Limit to 24 items
          }
        } else {
          // Process regular API response
          processedData = data.data || [];
        }
        
        // Sort by score/popularity (highest first)
        processedData = processedData.sort((a: JikanItem, b: JikanItem) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA;
        });
      }
      
      if (type === "anime") {
        if (loadMore) {
          setAnimeList(prev => [...prev, ...processedData]);
        } else {
          setAnimeList(processedData);
        }
      } else {
        if (loadMore) {
          setMangaList(prev => [...prev, ...processedData]);
        } else {
          setMangaList(processedData);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast({
        title: `Error fetching ${type}`,
        description: "Please try again later.",
        variant: "destructive"
      });
      
      // Fallback data
      const fallbackData: JikanItem[] = [
        {
          mal_id: 1,
          title: "Attack on Titan",
          images: {
            jpg: {
              image_url: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
              small_image_url: "https://cdn.myanimelist.net/images/anime/10/47347t.jpg",
              large_image_url: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg"
            }
          },
          year: 2013,
          score: 9.0,
          genres: [{ name: "Action" }, { name: "Drama" }],
          status: "Finished Airing",
          type: "TV",
          synopsis: "Humanity fights for survival against giant humanoid Titans that have brought them to the brink of extinction."
        },
        {
          mal_id: 2,
          title: "Demon Slayer",
          images: {
            jpg: {
              image_url: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
              small_image_url: "https://cdn.myanimelist.net/images/anime/1286/99889t.jpg",
              large_image_url: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg"
            }
          },
          year: 2019,
          score: 8.7,
          genres: [{ name: "Action" }, { name: "Supernatural" }],
          status: "Finished Airing",
          type: "TV",
          synopsis: "A young boy becomes a demon slayer to avenge his family and cure his sister who has been turned into a demon."
        }
      ];
      
      if (type === "anime") {
        setAnimeList(fallbackData);
      } else {
        setMangaList(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchData(activeTab as "anime" | "manga", "", 1);
  }, [activeTab]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchData(activeTab as "anime" | "manga", debouncedSearchQuery, nextPage, true);
  };

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return;
    setCurrentPage(1);
    fetchData(activeTab as "anime" | "manga", debouncedSearchQuery, 1);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(activeTab as "anime" | "manga", searchQuery, 1);
  };

  const handleFilterClick = (filterQuery: string) => {
    setSearchQuery(filterQuery);
    setCurrentPage(1);
    fetchData(activeTab as "anime" | "manga", filterQuery, 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const currentList = activeTab === "anime" ? animeList : mangaList;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-primary bg-clip-text text-transparent">Anime & Manga</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover anime and manga powered by MyAnimeList (Jikan API)
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="manga">Manga</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
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
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); fetchData(activeTab as "anime" | "manga", "", 1); }}
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
                  onClick={() => handleFilterClick("romance")}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Romance
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
                  onClick={() => handleFilterClick("comedy")}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Comedy
                </Badge>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {currentList.map((item) => (
                <MediaCard
                  key={item.mal_id}
                  id={item.mal_id.toString()}
                  title={item.title}
                  poster={item.images.jpg.image_url}
                  year={item.year}
                  rating={item.score}
                  genre={item.genres.map(g => g.name)}
                  type={activeTab as "anime" | "manga"}
                  synopsis={item.synopsis}
                  externalUrl={`https://myanimelist.net/${activeTab}/${item.mal_id}`}
                />
              ))}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
            {!loading && currentList.length > 0 && currentList.length >= 24 && (
              <div className="flex justify-center mt-12">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-smooth"
                >
                  Load More {activeTab === "anime" ? "Anime" : "Manga"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}