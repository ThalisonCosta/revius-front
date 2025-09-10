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
): Promise<{ success: boolean; listId?: string; error?: string }> {
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

    // Add movies to the list if any exist
    if (listData.movies.length > 0) {
      const listItems = listData.movies.map((movie, index) => ({
        list_id: createdList.id,
        media_id: movie.externalId || `external-${movie.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${movie.year || 'unknown'}`,
        media_title: movie.title,
        media_type: 'movie', // Default to movie for external imports
        media_year: movie.year,
        user_id: userId,
        position: index + 1,
      }));

      const { error: itemsError } = await supabaseClient
        .from('user_list_items')
        .insert(listItems);

      if (itemsError) {
        console.error('Error adding items to list:', itemsError);
        // Don't fail the entire operation, just log the error
        console.warn(`List created but failed to add ${listItems.length} items: ${itemsError.message}`);
      }
    }

    return { success: true, listId: createdList.id };
    
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
    return new Response(
      JSON.stringify({
        success: true,
        listName: listData.listName,
        listDescription: listData.listDescription,
        listId: dbResult.listId,
        moviesCount: listData.movies.length,
        service: listData.service,
        message: `Successfully imported "${listData.listName}" with ${listData.movies.length} movies`
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