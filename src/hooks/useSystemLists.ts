import { useState, useEffect } from 'react';
import { useUserLists } from './useUserLists';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SYSTEM_LISTS = [
  { name: 'To Read', description: 'Books, manga, and articles you want to read' },
  { name: 'To Watch', description: 'Movies, shows, and anime you want to watch' },
  { name: 'Watched', description: 'Movies, shows, and anime you have completed' },
  { name: 'Read', description: 'Books, manga, and articles you have read' },
  { name: 'Favorites', description: 'Your all-time favorite content' },
  { name: 'Currently Reading', description: 'Books and articles you are currently reading' },
  { name: 'Currently Watching', description: 'Movies and shows you are currently watching' }
];

export function useSystemLists() {
  const { lists, createList, loading } = useUserLists();
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeSystemLists = async () => {
      if (!user?.id || loading || initialized) return;
      
      setInitialized(true);
      
      try {
        let newListsCreated = 0;
        
        for (const systemList of SYSTEM_LISTS) {
          // Check if the list already exists
          const existingList = lists.find(list => list.name === systemList.name);
          if (!existingList) {
            await createList({
              name: systemList.name,
              description: systemList.description,
              is_public: false // System lists are private by default
            });
            newListsCreated++;
          }
        }
        
        if (newListsCreated > 0) {
          toast({
            title: "Welcome!",
            description: `${newListsCreated} default lists have been created for you.`,
          });
        }
      } catch (error) {
        console.error('Error creating system lists:', error);
        setInitialized(false); // Reset so it can try again
        toast({
          title: "Setup Error",
          description: "Failed to create default lists. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    };

    // Only initialize once after lists are loaded for the first time
    if (user?.id && !loading && !initialized && lists !== undefined) {
      initializeSystemLists();
    }
  }, [user?.id, loading, initialized, lists, createList]); // Keep lists in dependencies but use function inside useEffect

  const getSystemList = (name: string) => {
    return lists.find(list => list.name === name);
  };

  return {
    systemLists: SYSTEM_LISTS,
    getSystemList,
  };
}