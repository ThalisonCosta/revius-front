import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const OMDB_API_KEY = "47861d5a";

export interface SearchResult {
  id: string;
  title: string;
  poster: string;
  year: number;
  rating?: number;
  genre: string[];
  type: "movie" | "tv" | "anime" | "manga";
  platform: string;
  synopsis?: string;
  externalUrl?: string;
  originalId?: string;
}

export function useGlobalSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchContent = useCallback(async (query: string, sortBy: 'relevance' | 'rating' | 'year' = 'relevance') => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const searchPromises = [
        // Search OMDB for movies with details
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`)
          .then(res => res.json())
          .then(async (data) => {
            if (data.Response === "True" && data.Search) {
              // Get detailed info for first 5 results
              const detailedResults = await Promise.all(
                data.Search.slice(0, 5).map(async (item: any) => {
                  try {
                    const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=full`);
                    return await detailRes.json();
                  } catch {
                    return item;
                  }
                })
              );
              return { ...data, Search: detailedResults };
            }
            return data;
          }),
        
        // Search OMDB for TV series with details
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=series`)
          .then(res => res.json())
          .then(async (data) => {
            if (data.Response === "True" && data.Search) {
              // Get detailed info for first 5 results
              const detailedResults = await Promise.all(
                data.Search.slice(0, 5).map(async (item: any) => {
                  try {
                    const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=full`);
                    return await detailRes.json();
                  } catch {
                    return item;
                  }
                })
              );
              return { ...data, Search: detailedResults };
            }
            return data;
          }),
        
        // Search Jikan for anime
        fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`)
          .then(res => res.json()),
        
        // Search Jikan for manga
        fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=10&sfw=true`)
          .then(res => res.json()),
      ];

      const searchResults = await Promise.allSettled(searchPromises);
      const allResults: SearchResult[] = [];

      // Process OMDB movies
      if (searchResults[0].status === 'fulfilled') {
        const movieData = searchResults[0].value;
        if (movieData.Response === "True" && movieData.Search) {
          const movies = movieData.Search.map((movie: any) => ({
            id: `movie-${movie.imdbID}`,
            title: movie.Title,
            poster: movie.Poster !== "N/A" ? movie.Poster : "",
            year: parseInt(movie.Year) || new Date().getFullYear(),
            rating: movie.imdbRating ? parseFloat(movie.imdbRating) : 8.0,
            genre: movie.Genre ? movie.Genre.split(", ") : ["Movie"],
            type: "movie" as const,
            platform: "OMDB",
            synopsis: movie.Plot !== "N/A" ? movie.Plot : undefined,
            externalUrl: `https://www.imdb.com/title/${movie.imdbID}/`,
            originalId: movie.imdbID
          }));
          allResults.push(...movies);
        }
      }

      // Process OMDB TV series
      if (searchResults[1].status === 'fulfilled') {
        const seriesData = searchResults[1].value;
        if (seriesData.Response === "True" && seriesData.Search) {
          const series = seriesData.Search.map((show: any) => ({
            id: `tv-${show.imdbID}`,
            title: show.Title,
            poster: show.Poster !== "N/A" ? show.Poster : "",
            year: parseInt(show.Year) || new Date().getFullYear(),
            rating: show.imdbRating ? parseFloat(show.imdbRating) : 8.0,
            genre: show.Genre ? show.Genre.split(", ") : ["TV Series"],
            type: "tv" as const,
            platform: "OMDB",
            synopsis: show.Plot !== "N/A" ? show.Plot : undefined,
            externalUrl: `https://www.imdb.com/title/${show.imdbID}/`,
            originalId: show.imdbID
          }));
          allResults.push(...series);
        }
      }

      // Process Jikan anime
      if (searchResults[2].status === 'fulfilled') {
        const animeData = searchResults[2].value;
        if (animeData.data && Array.isArray(animeData.data)) {
          const anime = animeData.data.map((item: any) => ({
            id: `anime-${item.mal_id}`,
            title: item.title || item.title_english,
            poster: item.images?.jpg?.image_url || "",
            year: item.year || new Date().getFullYear(),
            rating: item.score || 8.0,
            genre: item.genres ? item.genres.map((g: any) => g.name).slice(0, 3) : ["Anime"],
            type: "anime" as const,
            platform: "MyAnimeList",
            synopsis: item.synopsis,
            externalUrl: `https://myanimelist.net/anime/${item.mal_id}/`,
            originalId: item.mal_id?.toString()
          }));
          allResults.push(...anime);
        }
      }

      // Process Jikan manga
      if (searchResults[3].status === 'fulfilled') {
        const mangaData = searchResults[3].value;
        if (mangaData.data && Array.isArray(mangaData.data)) {
          const manga = mangaData.data.map((item: any) => ({
            id: `manga-${item.mal_id}`,
            title: item.title || item.title_english,
            poster: item.images?.jpg?.image_url || "",
            year: item.published?.from ? new Date(item.published.from).getFullYear() : new Date().getFullYear(),
            rating: item.score || 8.0,
            genre: item.genres ? item.genres.map((g: any) => g.name).slice(0, 3) : ["Manga"],
            type: "manga" as const,
            platform: "MyAnimeList",
            synopsis: item.synopsis,
            externalUrl: `https://myanimelist.net/manga/${item.mal_id}/`,
            originalId: item.mal_id?.toString()
          }));
          allResults.push(...manga);
        }
      }

      // Sort results based on sortBy parameter
      let sortedResults = [...allResults];
      switch (sortBy) {
        case 'rating':
          sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'year':
          sortedResults.sort((a, b) => b.year - a.year);
          break;
        case 'relevance':
        default:
          // Keep original order (relevance from APIs)
          break;
      }

      setResults(sortedResults);
      
      toast({
        title: "Search completed",
        description: `Found ${sortedResults.length} results for "${query}"`,
      });

    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to search content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    searchContent,
    clearResults
  };
}
