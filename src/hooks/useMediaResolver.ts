import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MediaInfo {
  title: string;
  type: string;
  poster?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  synopsis?: string;
  runtime?: number;
  cast?: string[];
  externalUrl?: string;
}

interface ResolvedMedia {
  id: string; // Internal UUID
  externalId?: string; // Original external ID
  title: string;
  type: string;
  poster?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  synopsis?: string;
  runtime?: number;
  cast?: string[];
  externalUrl?: string;
}

// Map frontend types to database types
const mapMediaType = (type: string): 'movie' | 'novela' | 'book' | 'tv_series' | 'game' | 'anime' | 'dorama' => {
  switch (type) {
    case 'tv': return 'tv_series';
    case 'manga': return 'book';
    case 'movie': return 'movie';
    case 'anime': return 'anime';
    default: return 'movie';
  }
};

export function useMediaResolver() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const resolveMediaId = useCallback(async (
    externalId: string,
    mediaInfo: MediaInfo
  ): Promise<ResolvedMedia | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    setLoading(true);
    try {
      // First, try to find existing media by external_id
      const { data: existingMedia, error: findError } = await supabase
        .from('media')
        .select('*')
        .eq('external_id', externalId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw findError;
      }

      if (existingMedia) {
        // Media already exists, return it
        return {
          id: existingMedia.id,
          externalId: existingMedia.external_id || undefined,
          title: existingMedia.title,
          type: existingMedia.type,
          poster: existingMedia.thumbnail || undefined,
          year: existingMedia.year || undefined,
          genres: existingMedia.genres || undefined,
          synopsis: existingMedia.synopsis || undefined,
        };
      }

      // Media doesn't exist, create it
      const mediaSlug = `${mediaInfo.type}-${mediaInfo.title.replace(/\s+/g, '-').toLowerCase()}`;
      
      const { data: newMedia, error: createError } = await supabase
        .from('media')
        .insert({
          title: mediaInfo.title,
          type: mapMediaType(mediaInfo.type),
          slug: mediaSlug,
          external_id: externalId,
          thumbnail: mediaInfo.poster || null,
          year: mediaInfo.year || null,
          genres: mediaInfo.genres || null,
          synopsis: mediaInfo.synopsis || null,
          actors: mediaInfo.cast || null,
          added_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return {
        id: newMedia.id,
        externalId: newMedia.external_id || undefined,
        title: newMedia.title,
        type: newMedia.type,
        poster: newMedia.thumbnail || undefined,
        year: newMedia.year || undefined,
        genres: newMedia.genres || undefined,
        synopsis: newMedia.synopsis || undefined,
      };

    } catch (error) {
      console.error('Error resolving media ID:', error);
      toast({
        title: "Error",
        description: "Failed to resolve media information.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getMediaById = useCallback(async (mediaId: string): Promise<ResolvedMedia | null> => {
    setLoading(true);
    try {
      const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) throw error;

      return {
        id: media.id,
        externalId: media.external_id || undefined,
        title: media.title,
        type: media.type,
        poster: media.thumbnail || undefined,
        year: media.year || undefined,
        genres: media.genres || undefined,
        synopsis: media.synopsis || undefined,
      };

    } catch (error) {
      console.error('Error getting media by ID:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    resolveMediaId,
    getMediaById,
    loading,
  };
}