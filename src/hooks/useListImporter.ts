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

export interface FailedItem {
  title: string;
  year?: number;
  reason: string;
  position: number;
}

export interface ImportResult {
  success: boolean;
  listId?: string;
  listName?: string;
  moviesCount?: number;
  matchedCount?: number;
  failedCount?: number;
  matchPercentage?: number;
  failedItems?: FailedItem[];
  message?: string;
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

  const importFromExternalService = useCallback(async (url: string, service: string = 'letterboxd'): Promise<ImportResult> => {
    if (!user) {
      throw new Error('User must be logged in to import lists');
    }

    setIsImporting(true);
    updateProgress(0, 0, 'Processing list import...');

    try {
      // Call the new generic edge function that handles everything
      const { data, error } = await supabase.functions.invoke('import-external-list', {
        body: { url, service }
      });

      if (error) {
        throw new Error(error.message || `Failed to import list from ${service}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      // Success! The edge function already created the list and items
      updateProgress(1, 1, 'Import completed!');
      
      const result: ImportResult = {
        success: true,
        listId: data.listId,
        listName: data.listName,
        moviesCount: data.moviesCount,
        matchedCount: data.matchedCount,
        failedCount: data.failedCount,
        matchPercentage: data.matchPercentage,
        failedItems: data.failedItems,
        message: data.message
      };

      // Show appropriate toast based on results
      if (data.failedCount && data.failedCount > 0) {
        toast({
          title: "Import Completed with Warnings",
          description: `${data.matchedCount}/${data.moviesCount} items matched. ${data.failedCount} need manual review.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Import Successful!",
          description: `Successfully imported "${data.listName}" with ${data.moviesCount} movies (${data.matchPercentage}% matched)`,
        });
      }

      setIsImporting(false);
      return result;
      
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      
      toast({
        title: "Import Failed",
        description: error.message || 'Failed to import the list',
        variant: "destructive",
      });
      
      throw error;
    }
  }, [user, updateProgress, toast]);

  // Legacy function for backward compatibility - now just calls the new function
  const importFromLetterboxd = useCallback(async (url: string) => {
    return importFromExternalService(url, 'letterboxd');
  }, [importFromExternalService]);

  // Simplified processing for manual media matching (if needed in the future)
  const processNextMedia = useCallback(async () => {
    if (!pendingImport || !user) return;
    
    const { mediaItems, processedItems, currentIndex } = pendingImport;
    
    if (currentIndex >= mediaItems.length) {
      // All media processed
      updateProgress(mediaItems.length, mediaItems.length, 'Processing completed!');
      setPendingImport(null);
      setIsImporting(false);
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
  }, [pendingImport, user, searchForMedia, updateProgress]);

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

  const updateListItem = useCallback(async (listId: string, itemId: string, updatedMedia: SearchResult) => {
    if (!user) {
      throw new Error('User must be logged in to update items');
    }

    try {
      const { error } = await supabase
        .from('user_list_items')
        .update({
          media_id: updatedMedia.id,
          media_title: updatedMedia.title,
          media_type: updatedMedia.type,
          media_year: updatedMedia.year,
          media_thumbnail: updatedMedia.poster,
          external_id: updatedMedia.originalId || null,
          api_source: updatedMedia.platform || null
        })
        .eq('id', itemId)
        .eq('list_id', listId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Item Updated",
        description: `"${updatedMedia.title}" has been updated successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error updating list item:', error);
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update the item',
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

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
    importFromLetterboxd, // Keep for backward compatibility
    importFromExternalService, // New generic function
    handleMediaSelection,
    searchForMedia,
    updateListItem,
    cancelImport
  };
}