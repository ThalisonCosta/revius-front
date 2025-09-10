import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ListItem {
  id: string;
  list_id: string;
  media_id: string;
  media_title: string;
  media_thumbnail: string | null;
  media_type: string;
  media_year: number | null;
  media_synopsis: string | null;
  position: number | null;
  created_at: string | null;
  external_id: string | null;
  api_source: string | null;
}

export function useListItems(listId: string) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (listId && user) {
      fetchListItems();
    }
  }, [listId, user]);

  const fetchListItems = async () => {
    if (!listId || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_list_items')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });

      if (error) throw error;

      // Map database results to ListItem interface
      const mappedItems: ListItem[] = (data || []).map(item => ({
        id: item.id,
        list_id: item.list_id,
        media_id: item.media_id,
        media_title: item.media_title || '',
        media_thumbnail: item.media_thumbnail,
        media_type: item.media_type || '',
        media_year: item.media_year,
        media_synopsis: item.media_synopsis,
        position: item.position,
        created_at: item.created_at,
        external_id: item.external_id,
        api_source: item.api_source,
      }));
      setItems(mappedItems);
    } catch (error) {
      console.error('Error fetching list items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch list items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (mediaId: string, mediaData: {
    title: string;
    thumbnail?: string;
    type: string;
    year?: number;
    synopsis?: string;
    external_id?: string;
    api_source?: string;
  }) => {
    if (!listId || !user) return;

    try {
      // Get the next position
      const maxPosition = items.reduce((max, item) => 
        Math.max(max, item.position || 0), 0
      );

      const { data, error } = await supabase
        .from('user_list_items')
        .insert({
          list_id: listId,
          media_id: mediaId,
          media_title: mediaData.title,
          media_thumbnail: mediaData.thumbnail || null,
          media_type: mediaData.type,
          media_year: mediaData.year || null,
          media_synopsis: mediaData.synopsis || null,
          position: maxPosition + 1,
          external_id: mediaData.external_id || null,
          api_source: mediaData.api_source || 'manual'
        })
        .select('*')
        .single();

      if (error) throw error;

      const newItem: ListItem = {
        id: data.id,
        list_id: data.list_id,
        media_id: data.media_id,
        media_title: data.media_title || '',
        media_thumbnail: data.media_thumbnail,
        media_type: data.media_type || '',
        media_year: data.media_year,
        media_synopsis: data.media_synopsis,
        position: data.position,
        created_at: data.created_at,
        external_id: data.external_id,
        api_source: data.api_source,
      };
      setItems(prev => [...prev, newItem]);
      
      toast({
        title: "Success",
        description: "Item added to list!",
        variant: "success",
      });

      return data;
    } catch (error) {
      console.error('Error adding item to list:', error);
      toast({
        title: "Error",
        description: "Failed to add item to list.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Success",
        description: "Item removed from list!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error removing item from list:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from list.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reorderItems = async (newOrder: ListItem[]) => {
    if (!user) return;

    try {
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        position: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('user_list_items')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }

      setItems(newOrder);
      
      toast({
        title: "Success",
        description: "List order updated!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: "Error",
        description: "Failed to reorder items.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    items,
    loading,
    addItem,
    removeItem,
    reorderItems,
    refetch: fetchListItems,
  };
}