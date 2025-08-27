import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, List, Check } from "lucide-react";
import { useUserLists } from "@/hooks/useUserLists";
import { useListItems } from "@/hooks/useListItems";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddToListModalProps {
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  mediaPoster?: string;
  children?: React.ReactNode;
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

export function AddToListModal({ mediaId, mediaTitle, mediaType, mediaPoster, children }: AddToListModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [currentListItems, setCurrentListItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { lists } = useUserLists();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && mediaId) {
      fetchCurrentListItems();
    }
  }, [open, mediaId]);

  const fetchCurrentListItems = async () => {
    if (!user) return;

    try {
      // First get the actual media UUID from external_id
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('id')
        .eq('external_id', mediaId)
        .single();

      if (mediaError && mediaError.code !== 'PGRST116') throw mediaError;
      
      if (mediaData) {
        const { data, error } = await supabase
          .from('user_list_items')
          .select('list_id')
          .eq('media_id', mediaData.id);

        if (error) throw error;

        const listIds = data.map(item => item.list_id);
        setCurrentListItems(listIds);
        setSelectedLists(listIds);
      }
    } catch (error) {
      console.error('Error fetching current list items:', error);
    }
  };

  const handleListToggle = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Generate UUID for media and store external ID in slug
      const mediaUUID = crypto.randomUUID();
      const mediaSlug = `${mediaType}-${mediaTitle.replace(/\s+/g, '-').toLowerCase()}`;
      
      // First ensure media exists in database
      const { data: newMedia, error: mediaError } = await supabase
        .from('media')
        .upsert({
          title: mediaTitle,
          type: mapMediaType(mediaType),
          thumbnail: mediaPoster || null,
          slug: mediaSlug,
          external_id: mediaId, // Store original external ID
          added_by: user.id,
        }, { onConflict: 'external_id' })
        .select('id')
        .single();

      if (mediaError) {
        console.error('Error creating media:', mediaError);
        throw mediaError;
      }

      const actualMediaId = newMedia.id;

      // Remove from lists that were deselected
      const toRemove = currentListItems.filter(listId => !selectedLists.includes(listId));
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_list_items')
          .delete()
          .in('list_id', toRemove)
          .eq('media_id', actualMediaId);

        if (removeError) throw removeError;
      }

      // Add to newly selected lists
      const toAdd = selectedLists.filter(listId => !currentListItems.includes(listId));
      if (toAdd.length > 0) {
        const items = toAdd.map(listId => ({
          id: crypto.randomUUID(),
          list_id: listId,
          media_id: actualMediaId,
          user_id: user.id,
        }));

        const { error: addError } = await supabase
          .from('user_list_items')
          .insert(items);

        if (addError) throw addError;
      }

      toast({
        title: "Success",
        description: "Lists updated successfully!",
        variant: "success",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error updating lists:', error);
      toast({
        title: "Error",
        description: "Failed to update lists. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add to List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Lists</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select lists to add "{mediaTitle}" to:
          </div>

          {lists.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <List className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">No lists yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first list to organize your media
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {lists.map((list) => (
                <Card 
                  key={list.id}
                  className={`cursor-pointer transition-colors ${
                    selectedLists.includes(list.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleListToggle(list.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedLists.includes(list.id)}
                        onChange={() => {}} 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{list.name}</h4>
                          {!list.is_public && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                        </div>
                        {list.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {list.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {list.items_count || 0} items
                        </p>
                      </div>
                      {currentListItems.includes(list.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="shadow-primary" 
              disabled={loading || lists.length === 0}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}