// Media Details Service for fetching rich information from external APIs

export interface MediaGenre {
  id: number;
  name: string;
}

export interface MediaCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string;
}

export interface MediaDetails {
  // Basic Info
  id: string;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  
  // Ratings & Scores
  vote_average?: number;
  vote_count?: number;
  imdb_rating?: string;
  mal_score?: number;
  
  // Dates & Duration
  release_date?: string;
  first_air_date?: string;
  runtime?: number; // in minutes
  episode_duration?: number;
  episodes?: number;
  
  // Classification & Genres
  genres: MediaGenre[];
  content_rating?: string;
  
  // Production
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  
  // Cast & Crew
  cast?: MediaCastMember[];
  director?: string;
  creators?: string[];
  
  // External Links
  external_urls?: {
    imdb?: string;
    tmdb?: string;
    mal?: string;
    homepage?: string;
  };
  
  // Type-specific
  media_type: 'movie' | 'tv' | 'anime' | 'manga';
  
  // Status
  status?: string;
  
  // Additional fields for anime/manga
  source?: string; // For anime: manga, novel, original, etc.
  studios?: Array<{
    name: string;
  }>;
}

const TMDB_API_KEY = "YOUR_TMDB_API_KEY"; // TODO: Move to environment variables
const OMDB_API_KEY = "47861d5a";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Simple cache implementation
const cache = new Map<string, { data: MediaDetails; timestamp: number }>();

function getCachedData(key: string): MediaDetails | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: MediaDetails): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export class MediaDetailsService {
  /**
   * Fetch detailed media information by external ID and API source
   */
  static async getMediaDetails(externalId: string, apiSource: string): Promise<MediaDetails | null> {
    const cacheKey = `${apiSource}:${externalId}`;
    
    // Check cache first
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      let details: MediaDetails | null = null;
      
      switch (apiSource) {
        case 'tmdb':
          details = await this.fetchTMDBDetails(externalId);
          break;
        case 'omdb':
          details = await this.fetchOMDBDetails(externalId);
          break;
        case 'jikan':
          details = await this.fetchJikanDetails(externalId);
          break;
        default:
          console.warn(`Unsupported API source: ${apiSource}`);
          return null;
      }
      
      if (details) {
        setCachedData(cacheKey, details);
      }
      
      return details;
    } catch (error) {
      console.error(`Error fetching media details from ${apiSource}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch details from TMDB API
   */
  private static async fetchTMDBDetails(tmdbId: string): Promise<MediaDetails | null> {
    // Determine if it's a movie or TV show based on the media_id format
    const isMovie = tmdbId.includes('movie') || !tmdbId.includes('tv');
    const cleanId = tmdbId.replace(/^(tmdb-)?(movie-|tv-)?/, '');
    const mediaType = isMovie ? 'movie' : 'tv';
    
    const detailsResponse = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${cleanId}?api_key=${TMDB_API_KEY}&append_to_response=credits,external_ids`
    );
    
    if (!detailsResponse.ok) {
      throw new Error(`TMDB API error: ${detailsResponse.status}`);
    }
    
    const data = await detailsResponse.json();
    
    return {
      id: cleanId,
      title: data.title || data.name,
      original_title: data.original_title || data.original_name,
      overview: data.overview,
      poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
      backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : undefined,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      release_date: data.release_date || data.first_air_date,
      first_air_date: data.first_air_date,
      runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]),
      episodes: data.number_of_episodes,
      genres: data.genres || [],
      production_companies: data.production_companies || [],
      cast: data.credits?.cast?.slice(0, 10).map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : undefined
      })) || [],
      director: data.credits?.crew?.find((person: any) => person.job === 'Director')?.name,
      creators: data.created_by?.map((creator: any) => creator.name) || [],
      external_urls: {
        tmdb: `https://www.themoviedb.org/${mediaType}/${cleanId}`,
        imdb: data.external_ids?.imdb_id ? `https://www.imdb.com/title/${data.external_ids.imdb_id}` : undefined,
        homepage: data.homepage || undefined
      },
      media_type: isMovie ? 'movie' : 'tv',
      status: data.status
    };
  }
  
  /**
   * Fetch details from OMDB API
   */
  private static async fetchOMDBDetails(imdbId: string): Promise<MediaDetails | null> {
    const cleanId = imdbId.replace(/^(omdb-)?(movie-|tv-)?/, '');
    
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${cleanId}&plot=full`
    );
    
    if (!response.ok) {
      throw new Error(`OMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Response === "False") {
      throw new Error(`OMDB error: ${data.Error}`);
    }
    
    return {
      id: cleanId,
      title: data.Title,
      overview: data.Plot !== "N/A" ? data.Plot : undefined,
      poster_path: data.Poster !== "N/A" ? data.Poster : undefined,
      imdb_rating: data.imdbRating !== "N/A" ? data.imdbRating : undefined,
      release_date: data.Released !== "N/A" ? data.Released : undefined,
      runtime: data.Runtime !== "N/A" ? parseInt(data.Runtime.replace(/\D/g, '')) : undefined,
      genres: data.Genre !== "N/A" ? data.Genre.split(', ').map((name: string, index: number) => ({
        id: index,
        name: name.trim()
      })) : [],
      director: data.Director !== "N/A" ? data.Director : undefined,
      cast: data.Actors !== "N/A" ? data.Actors.split(', ').slice(0, 10).map((name: string, index: number) => ({
        id: index,
        name: name.trim()
      })) : [],
      production_companies: data.Production !== "N/A" ? [{
        id: 0,
        name: data.Production
      }] : [],
      external_urls: {
        imdb: `https://www.imdb.com/title/${cleanId}`
      },
      media_type: data.Type === 'movie' ? 'movie' : 'tv',
      content_rating: data.Rated !== "N/A" ? data.Rated : undefined
    };
  }
  
  /**
   * Fetch details from Jikan API (MyAnimeList)
   */
  private static async fetchJikanDetails(malId: string): Promise<MediaDetails | null> {
    const cleanId = malId.replace(/^(jikan-)?(anime-|manga-)?/, '');
    const isAnime = malId.includes('anime') || !malId.includes('manga');
    const mediaType = isAnime ? 'anime' : 'manga';
    
    const response = await fetch(
      `https://api.jikan.moe/v4/${mediaType}/${cleanId}/full`
    );
    
    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }
    
    const { data } = await response.json();
    
    return {
      id: cleanId,
      title: data.title,
      original_title: data.title_japanese,
      overview: data.synopsis,
      poster_path: data.images?.jpg?.large_image_url,
      backdrop_path: data.images?.jpg?.large_image_url, // Anime doesn't have separate backdrop
      mal_score: data.score,
      vote_count: data.scored_by,
      release_date: data.aired?.from || data.published?.from,
      runtime: data.duration ? parseInt(data.duration.replace(/\D/g, '')) : undefined,
      episodes: data.episodes || data.chapters,
      genres: data.genres?.map((genre: any) => ({
        id: genre.mal_id,
        name: genre.name
      })) || [],
      studios: data.studios?.map((studio: any) => ({
        name: studio.name
      })) || [],
      source: data.source,
      external_urls: {
        mal: `https://myanimelist.net/${mediaType}/${cleanId}`
      },
      media_type: isAnime ? 'anime' : 'manga',
      status: data.status
    };
  }
}

export default MediaDetailsService;