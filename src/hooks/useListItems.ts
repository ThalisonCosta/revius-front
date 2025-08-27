import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ListItem {
  id: string;
  list_id: string;
  media_id: string;
  position: number | null;
  created_at: string | null;
  media: {
    id: string;
    title: string;
    thumbnail: string | null;
    type: string;
    year: number | null;
    synopsis: string | null;
  };
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
        .select(`
          *,
          media:media_id (
            id,
            title,
            thumbnail,
            type,
            year,
            synopsis
          )
        `)
        .eq('list_id', listId)
        .order('position', { ascending: true });

      if (error) throw error;

      setItems(data || []);
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

  const addItem = async (mediaId: string) => {
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
          position: maxPosition + 1
        })
        .select(`
          *,
          media:media_id (
            id,
            title,
            thumbnail,
            type,
            year,
            synopsis
          )
        `)
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      
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