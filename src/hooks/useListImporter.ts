import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';

export interface ImportedMedia {
  title: string;
  year?: number;
  originalId?: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface MediaMatch {
  originalTitle: string;
  originalYear?: number;
  matches: SearchResult[];
}

export function useListImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: ''
  });
  const [currentMediaMatch, setCurrentMediaMatch] = useState<MediaMatch | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    listName: string;
    listDescription: string;
    mediaItems: ImportedMedia[];
    processedItems: SearchResult[];
    currentIndex: number;
  } | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { searchContent } = useGlobalSearch();

  const updateProgress = useCallback((current: number, total: number, status: string) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    setProgress({ current, total, percentage, status });
  }, []);

  const searchForMedia = useCallback(async (title: string, year?: number): Promise<SearchResult[]> => {
    try {
      const searchQuery = year ? `${title} ${year}` : title;
      const results: SearchResult[] = [];
      
      // Use the global search to find matches
      await new Promise<void>((resolve) => {
        searchContent(searchQuery).then(() => resolve()).catch(() => resolve());
      });
      
      // Since we can't directly get results from searchContent, we'll use a direct API approach
      const OMDB_API_KEY = "47861d5a";
      
      const movieResponse = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=movie`
      );
      const movieData = await movieResponse.json();
      
      if (movieData.Response === "True" && movieData.Search) {
        const movieMatches = movieData.Search
          .filter((item: any) => {
            if (!year) return true;
            const itemYear = parseInt(item.Year);
            return Math.abs(itemYear - year) <= 1; // Allow 1 year difference
          })
          .slice(0, 5)
          .map((movie: any) => ({
            id: `movie-${movie.imdbID}`,
            title: movie.Title,
            poster: movie.Poster !== "N/A" ? movie.Poster : "",
            year: parseInt(movie.Year) || new Date().getFullYear(),
            rating: 8.0, // Default rating, will be updated with detailed info
            genre: ["Movie"],
            type: "movie" as const,
            platform: "OMDB",
            externalUrl: `https://www.imdb.com/title/${movie.imdbID}/`,
            originalId: movie.imdbID
          }));
        
        results.push(...movieMatches);
      }

      // Also search for TV series
      const tvResponse = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&type=series`
      );
      const tvData = await tvResponse.json();
      
      if (tvData.Response === "True" && tvData.Search) {
        const tvMatches = tvData.Search
          .filter((item: any) => {
            if (!year) return true;
            const itemYear = parseInt(item.Year);
            return Math.abs(itemYear - year) <= 1;
          })
          .slice(0, 3)
          .map((show: any) => ({
            id: `tv-${show.imdbID}`,
            title: show.Title,
            poster: show.Poster !== "N/A" ? show.Poster : "",
            year: parseInt(show.Year) || new Date().getFullYear(),
            rating: 8.0,
            genre: ["TV Series"],
            type: "tv" as const,
            platform: "OMDB",
            externalUrl: `https://www.imdb.com/title/${show.imdbID}/`,
            originalId: show.imdbID
          }));
        
        results.push(...tvMatches);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching for media:', error);
      return [];
    }
  }, [searchContent]);

  const processNextMedia = useCallback(async () => {
    if (!pendingImport || !user) return;
    
    const { mediaItems, processedItems, currentIndex, listName, listDescription } = pendingImport;
    
    if (currentIndex >= mediaItems.length) {
      // All media processed, create the list
      try {
        updateProgress(currentIndex, mediaItems.length, 'Creating list...');
        
        // Create the list in the database
        const { data: listData, error: listError } = await supabase
          .from('user_lists')
          .insert({
            name: listName,
            description: listDescription || `Imported from Letterboxd`,
            is_public: true,
            user_id: user.id,
          })
          .select()
          .single();

        if (listError) throw listError;

        // Add all processed items to the list
        if (processedItems.length > 0) {
          const listItems = processedItems.map((item) => ({
            list_id: listData.id,
            media_id: item.originalId || item.id,
            media_title: item.title,
            media_type: item.type,
            media_year: item.year,
            user_id: user.id,
          }));

          const { error: itemsError } = await supabase
            .from('user_list_items')
            .insert(listItems);

          if (itemsError) throw itemsError;
        }

        // Success!
        updateProgress(mediaItems.length, mediaItems.length, 'Import completed!');
        
        toast({
          title: "Import Successful!",
          description: `Created "${listName}" with ${processedItems.length} out of ${mediaItems.length} movies`,
        });

        // Clean up
        setPendingImport(null);
        setIsImporting(false);
        
      } catch (error) {
        console.error('Error creating imported list:', error);
        toast({
          title: "Import Failed",
          description: "Failed to create the imported list",
          variant: "destructive",
        });
        
        setPendingImport(null);
        setIsImporting(false);
      }
      
      return;
    }

    // Process current media
    const currentMedia = mediaItems[currentIndex];
    updateProgress(currentIndex + 1, mediaItems.length, `Processing: ${currentMedia.title}`);
    
    const matches = await searchForMedia(currentMedia.title, currentMedia.year);
    
    if (matches.length === 0) {
      // No matches found, skip this item
      setPendingImport(prev => prev ? {
        ...prev,
        currentIndex: currentIndex + 1
      } : null);
      
      // Continue to next media
      setTimeout(processNextMedia, 100);
    } else if (matches.length === 1) {
      // Single match, auto-select
      setPendingImport(prev => prev ? {
        ...prev,
        processedItems: [...processedItems, matches[0]],
        currentIndex: currentIndex + 1
      } : null);
      
      // Continue to next media
      setTimeout(processNextMedia, 100);
    } else {
      // Multiple matches, need user selection
      setCurrentMediaMatch({
        originalTitle: currentMedia.title,
        originalYear: currentMedia.year,
        matches
      });
    }
  }, [pendingImport, user, searchForMedia, updateProgress, toast]);

  const handleMediaSelection = useCallback((selectedMedia: SearchResult | null) => {
    if (!pendingImport) return;
    
    const { processedItems, currentIndex } = pendingImport;
    
    setPendingImport(prev => prev ? {
      ...prev,
      processedItems: selectedMedia ? [...processedItems, selectedMedia] : processedItems,
      currentIndex: currentIndex + 1
    } : null);
    
    setCurrentMediaMatch(null);
    
    // Continue processing
    setTimeout(processNextMedia, 100);
  }, [pendingImport, processNextMedia]);

  const importFromLetterboxd = useCallback(async (url: string) => {
    if (!user) {
      throw new Error('User must be logged in to import lists');
    }

    setIsImporting(true);
    updateProgress(0, 0, 'Fetching list data...');

    try {
      // Call Supabase function to scrape Letterboxd
      const { data, error } = await supabase.functions.invoke('import-letterboxd-list', {
        body: { url }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch list from Letterboxd');
      }

      const { listName, listDescription, movies } = data;

      if (!movies || movies.length === 0) {
        throw new Error('No movies found in the list or the list might be private');
      }

      // Start the import process
      setPendingImport({
        listName,
        listDescription,
        mediaItems: movies,
        processedItems: [],
        currentIndex: 0
      });

      updateProgress(0, movies.length, 'Starting import...');
      
      // Start processing
      setTimeout(processNextMedia, 500);
      
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      throw error;
    }
  }, [user, updateProgress, processNextMedia]);

  const cancelImport = useCallback(() => {
    setPendingImport(null);
    setCurrentMediaMatch(null);
    setIsImporting(false);
    updateProgress(0, 0, '');
  }, [updateProgress]);

  return {
    isImporting,
    progress,
    currentMediaMatch,
    importFromLetterboxd,
    handleMediaSelection,
    searchForMedia,
    cancelImport
  };
}