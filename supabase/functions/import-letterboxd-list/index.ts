import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LetterboxdMovie {
  title: string;
  year?: number;
  letterboxdId?: string;
}

interface LetterboxdList {
  listName: string;
  listDescription: string;
  movies: LetterboxdMovie[];
}

async function scrapeLetterboxdList(url: string): Promise<LetterboxdList> {
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
    
    // Parse HTML using regex (since we can't use DOM in Deno easily)
    const listNameMatch = html.match(/<h1[^>]*class="[^"]*list-title[^"]*"[^>]*>([^<]+)<\/h1>/);
    const listName = listNameMatch ? listNameMatch[1].trim() : 'Imported List';
    
    const listDescMatch = html.match(/<div[^>]*class="[^"]*list-description[^"]*"[^>]*>([^<]+)<\/div>/);
    const listDescription = listDescMatch ? listDescMatch[1].trim() : '';
    
    // Find all movie entries
    const movieRegex = /<li[^>]*class="[^"]*poster-container[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="([^"]+)"[\s\S]*?<\/li>/g;
    const movies: LetterboxdMovie[] = [];
    
    let match;
    while ((match = movieRegex.exec(html)) !== null) {
      const movieTitle = match[1];
      
      // Try to extract year from the movie title or nearby elements
      const yearMatch = movieTitle.match(/\((\d{4})\)$/);
      const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
      const cleanTitle = yearMatch ? movieTitle.replace(/\s*\(\d{4}\)$/, '') : movieTitle;
      
      movies.push({
        title: cleanTitle,
        year,
      });
    }
    
    // If the above regex doesn't work, try alternative patterns
    if (movies.length === 0) {
      // Alternative approach: look for film titles in data attributes or other patterns
      const altMovieRegex = /<div[^>]*data-film-name="([^"]+)"[^>]*>/g;
      while ((match = altMovieRegex.exec(html)) !== null) {
        const movieTitle = match[1];
        
        const yearMatch = movieTitle.match(/\((\d{4})\)$/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        const cleanTitle = yearMatch ? movieTitle.replace(/\s*\(\d{4}\)$/, '') : movieTitle;
        
        movies.push({
          title: cleanTitle,
          year,
        });
      }
    }
    
    // If still no movies found, try another pattern
    if (movies.length === 0) {
      // Look for film slugs in URLs and try to extract titles
      const slugRegex = /\/film\/([^/]+)\//g;
      const slugs = new Set<string>();
      
      while ((match = slugRegex.exec(html)) !== null) {
        slugs.add(match[1]);
      }
      
      // Convert slugs to titles (basic conversion)
      for (const slug of slugs) {
        const title = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/\b\d{4}\b/, match => `(${match})`); // Add parentheses around years
        
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
      movies: movies.slice(0, 100) // Limit to 100 movies to avoid overwhelming the system
    };
    
  } catch (error) {
    console.error('Error scraping Letterboxd:', error);
    throw new Error(`Failed to scrape Letterboxd list: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL format
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

    // Verify user is authenticated with Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

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

    // Scrape the Letterboxd list
    const listData = await scrapeLetterboxdList(url);
    
    if (listData.movies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No movies found in the list. Make sure the list is public and contains movies.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(listData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})