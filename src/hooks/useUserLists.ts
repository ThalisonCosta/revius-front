import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserList {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  items_count?: number;
}

interface CreateListData {
  name: string;
  description?: string;
  is_public: boolean;
}

export function useUserLists() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  const fetchLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_lists')
        .select(`
          *,
          user_list_items(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const listsWithCount = data.map(list => ({
        ...list,
        items_count: Array.isArray(list.user_list_items) ? list.user_list_items.length : ((list.user_list_items as any)?.[0]?.count || 0)
      }));

      setLists(listsWithCount);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your lists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createList = async (listData: CreateListData & { imported_from?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_lists')
        .insert({
          name: listData.name,
          description: listData.description,
          is_public: listData.is_public,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setLists(prev => [{ ...data, items_count: 0 }, ...prev]);
      
      toast({
        title: "Success",
        description: `List created successfully${listData.imported_from ? ` from ${listData.imported_from}` : ''}!`,
        variant: "success",
      });

      return data;
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: "Failed to create list.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateList = async (listId: string, updates: Partial<CreateListData>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setLists(prev => 
        prev.map(list => 
          list.id === listId 
            ? { ...list, ...data }
            : list
        )
      );

      toast({
        title: "Success",
        description: "List updated successfully!",
        variant: "success",
      });

      return data;
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: "Failed to update list.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteList = async (listId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLists(prev => prev.filter(list => list.id !== listId));

      toast({
        title: "Success",
        description: "List deleted successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error",
        description: "Failed to delete list.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    lists,
    loading,
    createList,
    updateList,
    deleteList,
    refetch: fetchLists,
  };
}