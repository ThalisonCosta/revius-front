import { useState, useEffect, useCallback } from "react";
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
import { useSystemLists } from "@/hooks/useSystemLists";

interface AddToListModalProps {
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  mediaPoster?: string;
  mediaYear?: number;
  mediaSynopsis?: string;
  children?: React.ReactNode;
}


export function AddToListModal({ mediaId, mediaTitle, mediaType, mediaPoster, mediaYear, mediaSynopsis, children }: AddToListModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [currentListItems, setCurrentListItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { lists } = useUserLists();
  const { user } = useAuth();
  const { toast } = useToast();
  const { systemLists } = useSystemLists();

  const fetchCurrentListItems = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_list_items')
        .select('list_id')
        .eq('media_id', mediaId) as any;

      if (error) throw error;

      const listIds = data.map(item => item.list_id);
      setCurrentListItems(listIds);
      setSelectedLists(listIds);
    } catch (error) {
      console.error('Error fetching current list items:', error);
    }
  }, [user, mediaId]);

  useEffect(() => {
    if (open && mediaId) {
      fetchCurrentListItems();
    }
  }, [open, mediaId, fetchCurrentListItems]);

  const handleListToggle = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Create an Account",
        description: "Please create an account to add media to lists",
        variant: "default",
      });
      return;
    }

    setLoading(true);
    try {
      // Remove from lists that were deselected
      const toRemove = currentListItems.filter(listId => !selectedLists.includes(listId));
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_list_items')
          .delete()
          .in('list_id', toRemove)
          .eq('media_id', mediaId) as any;

        if (removeError) throw removeError;
      }

      // Add to newly selected lists
      const toAdd = selectedLists.filter(listId => !currentListItems.includes(listId));
      if (toAdd.length > 0) {
        const items = toAdd.map(listId => ({
          list_id: listId,
          media_id: mediaId,
          media_title: mediaTitle,
          media_thumbnail: mediaPoster || null,
          media_type: mediaType,
          media_year: mediaYear || null,
          media_synopsis: mediaSynopsis || null,
          position: 1, // Default position
        }));

        const { error: addError } = await supabase
          .from('user_list_items')
          .insert(items) as any;

        if (addError) throw addError;
      }

      toast({
        title: "Success",
        description: "Lists updated successfully!",
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

{!user ? (
            // Show preview of system lists for unauthenticated users
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {systemLists.map((systemList, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer transition-colors border-border hover:border-primary/50"
                  onClick={() => {
                    toast({
                      title: "Create an Account",
                      description: "Please create an account to add media to lists",
                      variant: "default",
                    });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={false}
                        disabled
                        onChange={() => {}} 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{systemList.name}</h4>
                          <Badge variant="outline" className="text-xs">0 items</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {systemList.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lists.length === 0 ? (
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
              disabled={loading || (user && lists.length === 0)}
            >
              {loading ? "Saving..." : user ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}