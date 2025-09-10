import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExternalMedia {
  title: string;
  year?: number;
  externalId?: string;
}

interface MatchedMedia {
  title: string;
  year?: number;
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime' | 'manga' | 'novela';
  apiSource: string;
  poster?: string;
  rating?: number;
  synopsis?: string;
  externalUrl?: string;
}

interface ExternalList {
  listName: string;
  listDescription: string;
  movies: ExternalMedia[];
  service: string;
}

interface ImportRequest {
  url: string;
  service?: string;
}

// API Keys - In production, these should be environment variables
const TMDB_API_KEY = "YOUR_TMDB_API_KEY"; // Será necessário configurar
const OMDB_API_KEY = "47861d5a";

// Função para calcular similaridade entre strings (Levenshtein distance simplificada)
function calculateSimilarity(str1: string, str2: string): number {
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

// Busca na API do TMDB
async function searchTMDB(title: string, year?: number): Promise<MatchedMedia[]> {
  const results: MatchedMedia[] = [];
  
  try {
    // Buscar filmes
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year || ''}`
    );
    const movieData = await movieResponse.json();
    
    if (movieData.results) {
      for (const movie of movieData.results.slice(0, 3)) {
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
        const similarity = calculateSimilarity(title, movie.title);
        
        // Filtrar por ano se fornecido e calcular similaridade
        if (!year || !releaseYear || Math.abs(releaseYear - year) <= 1) {
          if (similarity > 0.7) { // Threshold de similaridade
            results.push({
              title: movie.title,
              year: releaseYear,
              mediaId: `tmdb-movie-${movie.id}`,
              mediaType: 'movie',
              apiSource: 'tmdb',
              poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
              rating: movie.vote_average,
              synopsis: movie.overview,
              externalUrl: `https://www.themoviedb.org/movie/${movie.id}`
            });
          }
        }
      }
    }
    
    // Buscar séries de TV
    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&first_air_date_year=${year || ''}`
    );
    const tvData = await tvResponse.json();
    
    if (tvData.results) {
      for (const show of tvData.results.slice(0, 3)) {
        const airYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : undefined;
        const similarity = calculateSimilarity(title, show.name);
        
        if (!year || !airYear || Math.abs(airYear - year) <= 1) {
          if (similarity > 0.7) {
            results.push({
              title: show.name,
              year: airYear,
              mediaId: `tmdb-tv-${show.id}`,
              mediaType: 'tv',
              apiSource: 'tmdb',
              poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
              rating: show.vote_average,
              synopsis: show.overview,
              externalUrl: `https://www.themoviedb.org/tv/${show.id}`
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error searching TMDB:', error);
  }
  
  return results;
}

// Busca na API do OMDB
async function searchOMDB(title: string, year?: number): Promise<MatchedMedia[]> {
  const results: MatchedMedia[] = [];
  
  try {
    // Buscar filmes
    const movieResponse = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=movie&y=${year || ''}`
    );
    const movieData = await movieResponse.json();
    
    if (movieData.Response === "True" && movieData.Search) {
      for (const movie of movieData.Search.slice(0, 3)) {
        const movieYear = parseInt(movie.Year) || undefined;
        const similarity = calculateSimilarity(title, movie.Title);
        
        if (!year || !movieYear || Math.abs(movieYear - year) <= 1) {
          if (similarity > 0.7) {
            results.push({
              title: movie.Title,
              year: movieYear,
              mediaId: `omdb-movie-${movie.imdbID}`,
              mediaType: 'movie',
              apiSource: 'omdb',
              poster: movie.Poster !== "N/A" ? movie.Poster : undefined,
              rating: undefined, // OMDB search não retorna rating
              synopsis: undefined,
              externalUrl: `https://www.imdb.com/title/${movie.imdbID}/`
            });
          }
        }
      }
    }
    
    // Buscar séries
    const tvResponse = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=series&y=${year || ''}`
    );
    const tvData = await tvResponse.json();
    
    if (tvData.Response === "True" && tvData.Search) {
      for (const show of tvData.Search.slice(0, 3)) {
        const showYear = parseInt(show.Year) || undefined;
        const similarity = calculateSimilarity(title, show.Title);
        
        if (!year || !showYear || Math.abs(showYear - year) <= 1) {
          if (similarity > 0.7) {
            results.push({
              title: show.Title,
              year: showYear,
              mediaId: `omdb-tv-${show.imdbID}`,
              mediaType: 'tv',
              apiSource: 'omdb',
              poster: show.Poster !== "N/A" ? show.Poster : undefined,
              rating: undefined,
              synopsis: undefined,
              externalUrl: `https://www.imdb.com/title/${show.imdbID}/`
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error searching OMDB:', error);
  }
  
  return results;
}

// Busca na API do Jikan (anime/manga)
async function searchJikan(title: string, year?: number): Promise<MatchedMedia[]> {
  const results: MatchedMedia[] = [];
  
  try {
    // Buscar anime
    const animeResponse = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=5&sfw=true`
    );
    const animeData = await animeResponse.json();
    
    if (animeData.data && Array.isArray(animeData.data)) {
      for (const anime of animeData.data.slice(0, 3)) {
        const animeYear = anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : undefined);
        const similarity = calculateSimilarity(title, anime.title);
        
        if (!year || !animeYear || Math.abs(animeYear - year) <= 2) { // Mais flexível para anime
          if (similarity > 0.6) { // Threshold mais baixo para anime devido a diferenças de tradução
            results.push({
              title: anime.title,
              year: animeYear,
              mediaId: `jikan-anime-${anime.mal_id}`,
              mediaType: 'anime',
              apiSource: 'jikan',
              poster: anime.images?.jpg?.image_url,
              rating: anime.score,
              synopsis: anime.synopsis,
              externalUrl: `https://myanimelist.net/anime/${anime.mal_id}/`
            });
          }
        }
      }
    }
    
    // Aguardar um pouco para evitar rate limiting da API Jikan
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Buscar manga
    const mangaResponse = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=5&sfw=true`
    );
    const mangaData = await mangaResponse.json();
    
    if (mangaData.data && Array.isArray(mangaData.data)) {
      for (const manga of mangaData.data.slice(0, 2)) {
        const mangaYear = manga.published?.from ? new Date(manga.published.from).getFullYear() : undefined;
        const similarity = calculateSimilarity(title, manga.title);
        
        if (!year || !mangaYear || Math.abs(mangaYear - year) <= 2) {
          if (similarity > 0.6) {
            results.push({
              title: manga.title,
              year: mangaYear,
              mediaId: `jikan-manga-${manga.mal_id}`,
              mediaType: 'manga',
              apiSource: 'jikan',
              poster: manga.images?.jpg?.image_url,
              rating: manga.score,
              synopsis: manga.synopsis,
              externalUrl: `https://myanimelist.net/manga/${manga.mal_id}/`
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error searching Jikan:', error);
  }
  
  return results;
}

// Busca no sistema local de novelas
async function searchNovelas(title: string, year?: number): Promise<MatchedMedia[]> {
  const results: MatchedMedia[] = [];
  
  try {
    // Buscar dados de novelas do JSON local (simulando uma busca em dados estáticos)
    // Na prática, isso seria uma consulta a uma API ou banco de dados de novelas
    const novelasData = await searchLocalNovelaData(title, year);
    
    for (const novela of novelasData) {
      const similarity = calculateSimilarity(title, novela.title);
      
      if (similarity > 0.6) { // Threshold mais baixo para novelas
        results.push({
          title: novela.title,
          year: novela.year?.start,
          mediaId: `novela-${novela.id}`,
          mediaType: 'novela',
          apiSource: 'local_novelas',
          poster: novela.imageUrl,
          rating: undefined, // Novelas não têm rating no sistema atual
          synopsis: novela.synopsis,
          externalUrl: novela.wikipediaUrl
        });
      }
    }
    
  } catch (error) {
    console.error('Error searching novelas:', error);
  }
  
  return results.slice(0, 3); // Limitar a 3 resultados para novelas
}

// Função auxiliar para simular busca em dados locais de novelas
async function searchLocalNovelaData(title: string, year?: number) {
  // Esta função simula uma busca nos dados de novelas
  // Na implementação real, isso consultaria diretamente o JSON de novelas ou uma API
  
  // Por enquanto, retorna um array vazio, mas a estrutura está preparada
  // para quando os dados de novelas estiverem disponíveis na edge function
  
  // Exemplo de como seria a estrutura:
  /*
  const novelasResponse = await fetch('/path/to/novelas.json');
  const novelasData = await novelasResponse.json();
  
  return novelasData.novelas.filter(novela => {
    const titleMatch = calculateSimilarity(title.toLowerCase(), novela.title.toLowerCase()) > 0.6;
    const yearMatch = !year || !novela.year?.start || Math.abs(novela.year.start - year) <= 2;
    return titleMatch && yearMatch;
  });
  */
  
  return []; // Placeholder até implementação completa dos dados
}

// Função principal para buscar mídia em todas as APIs
async function searchAllAPIs(title: string, year?: number): Promise<MatchedMedia[]> {
  const searchPromises = [
    searchTMDB(title, year),
    searchOMDB(title, year),
    searchJikan(title, year),
    searchNovelas(title, year) // Incluir busca de novelas
  ];
  
  try {
    const results = await Promise.allSettled(searchPromises);
    const allMatches: MatchedMedia[] = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allMatches.push(...result.value);
      }
    });
    
    // Ordenar por similaridade de título e rating
    allMatches.sort((a, b) => {
      const similarityA = calculateSimilarity(title, a.title);
      const similarityB = calculateSimilarity(title, b.title);
      
      if (similarityA !== similarityB) {
        return similarityB - similarityA; // Maior similaridade primeiro
      }
      
      // Se similaridade for igual, ordenar por rating
      return (b.rating || 0) - (a.rating || 0);
    });
    
    // Remover duplicatas baseado no título e ano
    const uniqueMatches: MatchedMedia[] = [];
    const seen = new Set<string>();
    
    for (const match of allMatches) {
      const key = `${match.title.toLowerCase()}-${match.year}-${match.mediaType}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(match);
      }
    }
    
    return uniqueMatches.slice(0, 5); // Retornar no máximo 5 matches
    
  } catch (error) {
    console.error('Error searching all APIs:', error);
    return [];
  }
}

async function scrapeLetterboxdList(url: string): Promise<ExternalList> {
  try {
    // Convert boxd.it short URL to full letterboxd URL if needed
    let fullUrl = url;
    if (url.includes('boxd.it')) {
      // Follow redirect to get full URL
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      fullUrl = response.url;
    }

    // Fetch the page content
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Improved parsing for list name - try multiple selectors
    let listName = 'Imported List';
    
    // Try different patterns for list name
    const namePatterns = [
      /<h1[^>]*class="[^"]*list-title[^"]*"[^>]*>([^<]+)<\/h1>/,
      /<h1[^>]*class="[^"]*list-name[^"]*"[^>]*>([^<]+)<\/h1>/,
      /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/,
      /<title>([^-|]+)/
    ];
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match) {
        listName = match[1].trim()
          .replace(/\s+/g, ' ')
          .replace(/^List\s*-\s*/i, '')
          .replace(/\s*-\s*Letterboxd$/i, '');
        if (listName && listName !== 'Letterboxd') {
          break;
        }
      }
    }
    
    // Try to get description
    let listDescription = '';
    const descPatterns = [
      /<div[^>]*class="[^"]*list-description[^"]*"[^>]*>\s*<p[^>]*>([^<]+)<\/p>/,
      /<div[^>]*class="[^"]*list-description[^"]*"[^>]*>([^<]+)<\/div>/,
      /<p[^>]*class="[^"]*body-text[^"]*"[^>]*>([^<]+)<\/p>/
    ];
    
    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match) {
        listDescription = match[1].trim().replace(/\s+/g, ' ');
        if (listDescription) break;
      }
    }
    
    // Find all movie entries with improved regex
    const movies: ExternalMedia[] = [];
    
    // Try multiple patterns for movie extraction
    const moviePatterns = [
      /<li[^>]*class="[^"]*poster-container[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="([^"]+)"[\s\S]*?<\/li>/g,
      /<div[^>]*data-film-name="([^"]+)"[^>]*>/g,
      /<li[^>]*class="[^"]*listitem[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<\/h3>/g
    ];
    
    for (const movieRegex of moviePatterns) {
      let match;
      while ((match = movieRegex.exec(html)) !== null) {
        const movieTitle = match[1];
        
        // Try to extract year from the movie title or nearby elements
        const yearMatch = movieTitle.match(/\((\d{4})\)$/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        const cleanTitle = yearMatch ? movieTitle.replace(/\s*\(\d{4}\)$/, '') : movieTitle;
        
        // Avoid duplicate entries
        const existingMovie = movies.find(m => 
          m.title.toLowerCase() === cleanTitle.toLowerCase() && 
          (!year || !m.year || Math.abs(m.year - year) <= 1)
        );
        
        if (!existingMovie) {
          movies.push({
            title: cleanTitle,
            year,
          });
        }
      }
      
      if (movies.length > 0) break; // Stop if we found movies with this pattern
    }
    
    // If still no movies found, try film slug extraction
    if (movies.length === 0) {
      const slugRegex = /\/film\/([^/]+)\//g;
      const slugs = new Set<string>();
      
      let match;
      while ((match = slugRegex.exec(html)) !== null) {
        slugs.add(match[1]);
      }
      
      // Convert slugs to titles (basic conversion)
      for (const slug of Array.from(slugs).slice(0, 100)) {
        const title = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/\b\d{4}\b/, match => `(${match})`);
        
        const yearMatch = title.match(/\((\d{4})\)$/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        const cleanTitle = yearMatch ? title.replace(/\s*\(\d{4}\)$/, '') : title;
        
        movies.push({
          title: cleanTitle,
          year,
        });
      }
    }

    return {
      listName,
      listDescription,
      movies: movies.slice(0, 100), // Limit to 100 movies
      service: 'letterboxd'
    };
    
  } catch (error) {
    console.error('Error scraping Letterboxd:', error);
    throw new Error(`Failed to scrape Letterboxd list: ${error.message}`);
  }
}

async function createListInDatabase(
  listData: ExternalList, 
  userId: string, 
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ success: boolean; listId?: string; error?: string; matchedCount?: number; totalCount?: number }> {
  try {
    // Create the list in the database
    const { data: createdList, error: listError } = await supabaseClient
      .from('user_lists')
      .insert({
        name: listData.listName,
        description: listData.listDescription || `Imported from ${listData.service}`,
        is_public: true,
        user_id: userId,
      })
      .select()
      .single();

    if (listError) {
      console.error('Error creating list:', listError);
      return { success: false, error: `Failed to create list: ${listError.message}` };
    }

    // Process movies and match with APIs
    if (listData.movies.length > 0) {
      const listItems: Array<{
        list_id: string;
        media_id: string;
        media_title: string;
        media_type: string;
        media_year?: number | null;
        media_thumbnail?: string | null;
        external_poster_url?: string | null;
        external_rating?: number | null;
        external_synopsis?: string | null;
        external_url?: string | null;
        api_source: string;
        user_id: string;
        position: number;
      }> = [];
      let matchedCount = 0;

      for (let i = 0; i < listData.movies.length; i++) {
        const movie = listData.movies[i];
        console.log(`Processing movie ${i + 1}/${listData.movies.length}: ${movie.title}`);
        
        try {
          // Buscar correspondências em todas as APIs
          const matches = await searchAllAPIs(movie.title, movie.year);
          
          let selectedMatch: MatchedMedia | null = null;
          
          if (matches.length > 0) {
            // Automaticamente selecionar a primeira correspondência (melhor match)
            selectedMatch = matches[0];
            matchedCount++;
            console.log(`Found match for "${movie.title}": ${selectedMatch.title} (${selectedMatch.apiSource})`);
          } else {
            console.log(`No matches found for "${movie.title}"`);
          }
          
          // Adicionar item à lista com dados completos das APIs externas
          if (selectedMatch) {
            listItems.push({
              list_id: createdList.id,
              media_id: selectedMatch.mediaId,
              media_title: selectedMatch.title,
              media_type: selectedMatch.mediaType,
              media_year: selectedMatch.year,
              media_thumbnail: selectedMatch.poster || null,
              external_poster_url: selectedMatch.poster || null,
              external_rating: selectedMatch.rating || null,
              external_synopsis: selectedMatch.synopsis || null,
              external_url: selectedMatch.externalUrl || null,
              api_source: selectedMatch.apiSource,
              user_id: userId,
              position: i + 1
            });
          } else {
            // Fallback para dados básicos se não encontrar correspondência
            listItems.push({
              list_id: createdList.id,
              media_id: movie.externalId || `external-${movie.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${movie.year || 'unknown'}`,
              media_title: movie.title,
              media_type: 'movie', // Default para filmes
              media_year: movie.year,
              media_thumbnail: null,
              external_poster_url: null,
              external_rating: null,
              external_synopsis: null,
              external_url: null,
              api_source: 'manual',
              user_id: userId,
              position: i + 1
            });
          }
          
          // Pequena pausa para evitar rate limiting
          if (i % 5 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Error processing movie "${movie.title}":`, error);
          // Adicionar com dados básicos em caso de erro
          listItems.push({
            list_id: createdList.id,
            media_id: movie.externalId || `external-${movie.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${movie.year || 'unknown'}`,
            media_title: movie.title,
            media_type: 'movie',
            media_year: movie.year,
            media_thumbnail: null,
            external_poster_url: null,
            external_rating: null,
            external_synopsis: null,
            external_url: null,
            api_source: 'manual',
            user_id: userId,
            position: i + 1
          });
        }
      }

      // Inserir todos os itens no banco
      if (listItems.length > 0) {
        const { error: itemsError } = await supabaseClient
          .from('user_list_items')
          .insert(listItems);

        if (itemsError) {
          console.error('Error adding items to list:', itemsError);
          // Não falhar toda a operação, apenas logar o erro
          console.warn(`List created but failed to add ${listItems.length} items: ${itemsError.message}`);
        }
      }

      return { 
        success: true, 
        listId: createdList.id, 
        matchedCount, 
        totalCount: listData.movies.length 
      };
    }

    return { success: true, listId: createdList.id, matchedCount: 0, totalCount: 0 };
    
  } catch (error) {
    console.error('Error in createListInDatabase:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, service = 'letterboxd' }: ImportRequest = body;
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL format based on service
    if (service === 'letterboxd') {
      const letterboxdPattern = /^https?:\/\/(www\.)?(letterboxd\.com\/.*\/list\/.*|boxd\.it\/.*)/i;
      if (!letterboxdPattern.test(url)) {
        return new Response(
          JSON.stringify({ error: 'Invalid Letterboxd URL format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Scrape the external list based on service
    let listData: ExternalList;
    
    if (service === 'letterboxd') {
      listData = await scrapeLetterboxdList(url);
    } else {
      return new Response(
        JSON.stringify({ error: `Service '${service}' is not supported yet` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (listData.movies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No movies found in the list. Make sure the list is public and contains movies.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the list in the database
    const dbResult = await createListInDatabase(listData, user.id, supabaseClient);
    
    if (!dbResult.success) {
      return new Response(
        JSON.stringify({ error: dbResult.error || 'Failed to create list in database' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response with the actual data
    const matchedCount = dbResult.matchedCount || 0;
    const totalCount = dbResult.totalCount || listData.movies.length;
    const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
    
    return new Response(
      JSON.stringify({
        success: true,
        listName: listData.listName,
        listDescription: listData.listDescription,
        listId: dbResult.listId,
        moviesCount: listData.movies.length,
        matchedCount: matchedCount,
        matchPercentage: matchPercentage,
        service: listData.service,
        message: `Successfully imported "${listData.listName}" with ${listData.movies.length} movies (${matchedCount} matched with APIs - ${matchPercentage}%)`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})