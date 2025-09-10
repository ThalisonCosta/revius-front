import { useState, useEffect } from 'react';
import { MediaDetails, MediaDetailsService } from '@/services/mediaDetailsService';

interface UseMediaDetailsOptions {
  enabled?: boolean; // Whether to fetch automatically
}

interface UseMediaDetailsReturn {
  details: MediaDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching detailed media information from external APIs
 * 
 * @param externalId - The external API ID (TMDB ID, IMDB ID, MAL ID, etc.)
 * @param apiSource - The API source ('tmdb', 'omdb', 'jikan')
 * @param options - Configuration options
 */
export function useMediaDetails(
  externalId: string | null | undefined,
  apiSource: string | null | undefined,
  options: UseMediaDetailsOptions = {}
): UseMediaDetailsReturn {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { enabled = true } = options;
  
  const fetchDetails = async () => {
    if (!externalId || !apiSource) {
      setDetails(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const mediaDetails = await MediaDetailsService.getMediaDetails(externalId, apiSource);
      setDetails(mediaDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (enabled && externalId && apiSource) {
      fetchDetails();
    } else {
      setDetails(null);
      setError(null);
      setLoading(false);
    }
  }, [externalId, apiSource, enabled]);
  
  return {
    details,
    loading,
    error,
    refetch: fetchDetails
  };
}

/**
 * Hook for fetching multiple media details at once
 * Useful for list views where you want to show rich details for multiple items
 */
export function useMultipleMediaDetails(
  items: Array<{ externalId: string | null; apiSource: string | null; mediaId: string }>,
  options: UseMediaDetailsOptions = {}
) {
  const [detailsMap, setDetailsMap] = useState<Map<string, MediaDetails>>(new Map());
  const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  
  const { enabled = true } = options;
  
  const fetchAllDetails = async () => {
    if (!enabled || items.length === 0) return;
    
    // Initialize loading states
    const newLoadingMap = new Map<string, boolean>();
    items.forEach(item => {
      if (item.externalId && item.apiSource) {
        newLoadingMap.set(item.mediaId, true);
      }
    });
    setLoadingMap(newLoadingMap);
    
    // Fetch details for each item
    const promises = items.map(async (item) => {
      if (!item.externalId || !item.apiSource) return;
      
      try {
        const details = await MediaDetailsService.getMediaDetails(item.externalId, item.apiSource);
        if (details) {
          setDetailsMap(prev => new Map(prev).set(item.mediaId, details));
        }
        setErrorMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(item.mediaId);
          return newMap;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch details';
        setErrorMap(prev => new Map(prev).set(item.mediaId, errorMessage));
      } finally {
        setLoadingMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(item.mediaId);
          return newMap;
        });
      }
    });
    
    await Promise.allSettled(promises);
  };
  
  useEffect(() => {
    fetchAllDetails();
  }, [JSON.stringify(items), enabled]);
  
  const getDetailsForItem = (mediaId: string) => ({
    details: detailsMap.get(mediaId) || null,
    loading: loadingMap.get(mediaId) || false,
    error: errorMap.get(mediaId) || null
  });
  
  return {
    getDetailsForItem,
    refetchAll: fetchAllDetails,
    allLoading: Array.from(loadingMap.values()).some(loading => loading),
    hasErrors: errorMap.size > 0
  };
}