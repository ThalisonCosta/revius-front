const OMDB_API_KEY = "47861d5a";

export interface SearchResult {
  id: string;
  title: string;
  year?: number;
  poster?: string;
  type: 'movie' | 'tv';
  imdbRating?: string;
  plot?: string;
  director?: string;
  actors?: string;
  runtime?: string;
  genre?: string;
  externalUrl?: string;
}

export interface MediaSearchOptions {
  type?: 'movie' | 'series' | 'all';
  year?: number;
  limit?: number;
}

/**
 * Search for media using OMDB API
 */
export async function searchMedia(
  query: string, 
  options: MediaSearchOptions = {}
): Promise<SearchResult[]> {
  const { type = 'all', year, limit = 10 } = options;
  const results: SearchResult[] = [];

  try {
    // Search movies if type is 'movie' or 'all'
    if (type === 'movie' || type === 'all') {
      const movieResults = await searchOMDB(query, 'movie', year, Math.ceil(limit / 2));
      results.push(...movieResults);
    }

    // Search TV series if type is 'series' or 'all'
    if (type === 'series' || type === 'all') {
      const tvResults = await searchOMDB(query, 'series', year, Math.ceil(limit / 2));
      results.push(...tvResults);
    }

    // Sort by relevance (exact matches first, then by year if available)
    return results
      .sort((a, b) => {
        const aExactMatch = a.title.toLowerCase() === query.toLowerCase();
        const bExactMatch = b.title.toLowerCase() === query.toLowerCase();
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // If both or neither are exact matches, sort by year (newer first)
        return (b.year || 0) - (a.year || 0);
      })
      .slice(0, limit);

  } catch (error) {
    console.error('Error searching media:', error);
    throw new Error('Failed to search for media. Please try again.');
  }
}

/**
 * Get detailed information for a specific media item
 */
export async function getMediaDetails(imdbId: string): Promise<SearchResult | null> {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`
    );
    const data = await response.json();

    if (data.Response === "True") {
      return {
        id: data.imdbID,
        title: data.Title,
        year: data.Year ? parseInt(data.Year) : undefined,
        poster: data.Poster !== "N/A" ? data.Poster : undefined,
        type: data.Type === 'series' ? 'tv' : 'movie',
        imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : undefined,
        plot: data.Plot !== "N/A" ? data.Plot : undefined,
        director: data.Director !== "N/A" ? data.Director : undefined,
        actors: data.Actors !== "N/A" ? data.Actors : undefined,
        runtime: data.Runtime !== "N/A" ? data.Runtime : undefined,
        genre: data.Genre !== "N/A" ? data.Genre : undefined,
        externalUrl: `https://www.imdb.com/title/${data.imdbID}/`
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching media details:', error);
    return null;
  }
}

/**
 * Internal function to search OMDB API
 */
async function searchOMDB(
  query: string, 
  type: 'movie' | 'series', 
  year?: number,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    let url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=${type}`;
    if (year) {
      url += `&y=${year}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "True" && data.Search) {
      // Get detailed information for each result
      const detailedResults = await Promise.all(
        data.Search.slice(0, limit).map(async (item: {
          imdbID: string;
          Title: string;
          Year: string;
          Poster: string;
          Type: string;
        }) => {
          const details = await getMediaDetails(item.imdbID);
          return details || {
            id: item.imdbID,
            title: item.Title,
            year: item.Year ? parseInt(item.Year) : undefined,
            poster: item.Poster !== "N/A" ? item.Poster : undefined,
            type: item.Type === 'series' ? 'tv' as const : 'movie' as const,
            externalUrl: `https://www.imdb.com/title/${item.imdbID}/`
          };
        })
      );

      return detailedResults.filter((result): result is SearchResult => result !== null);
    }

    return [];
  } catch (error) {
    console.error(`Error searching OMDB for ${type}:`, error);
    return [];
  }
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}