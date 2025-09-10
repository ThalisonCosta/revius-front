import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, List, Check, Search, AlertCircle, ExternalLink, Star } from "lucide-react";
import { useUserLists } from "@/hooks/useUserLists";
import { useListItems } from "@/hooks/useListItems";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSystemLists } from "@/hooks/useSystemLists";
import { searchMedia, SearchResult } from "@/utils/mediaSearch";

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
  
  // Fallback search states
  const [showFallbackSearch, setShowFallbackSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { lists } = useUserLists();
  const { user } = useAuth();
  const { toast } = useToast();
  const { systemLists } = useSystemLists();

  // Initialize search query with media title
  useEffect(() => {
    if (open && mediaTitle) {
      setSearchQuery(mediaTitle);
      setShowFallbackSearch(false);
      setSelectedSearchResult(null);
      setSearchResults([]);
      setSearchPerformed(false);
    }
  }, [open, mediaTitle]);

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const results = await searchMedia(searchQuery, { 
        type: mediaType === 'tv' ? 'series' : 'movie',
        limit: 10
      });
      setSearchResults(results);
      setSearchPerformed(true);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    setSelectedSearchResult(result);
  };

  const fetchCurrentListItems = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_list_items')
        .select('list_id')
        .eq('media_id', mediaId);

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
          .eq('media_id', mediaId);

        if (removeError) throw removeError;
      }

      // Add to newly selected lists
      const toAdd = selectedLists.filter(listId => !currentListItems.includes(listId));
      if (toAdd.length > 0) {
        // Use selected search result data if available, otherwise use original data
        const selectedMedia = selectedSearchResult || {
          title: mediaTitle,
          poster: mediaPoster,
          type: mediaType === 'tv' ? 'tv' : 'movie',
          year: mediaYear,
          plot: mediaSynopsis,
          id: mediaId
        };

        console.log('Adding items with data:', selectedMedia);
        
        const items = toAdd.map(listId => ({
          list_id: listId,
          media_id: selectedSearchResult ? selectedSearchResult.id : mediaId,
          media_title: selectedMedia.title || mediaTitle,
          media_thumbnail: selectedMedia.poster || mediaPoster || null,
          media_type: selectedMedia.type === 'tv' ? 'tv' : mediaType,
          media_year: selectedMedia.year || mediaYear || null,
          media_synopsis: selectedMedia.plot || mediaSynopsis || null,
          external_poster_url: selectedSearchResult ? selectedMedia.poster || null : null,
          external_rating: selectedSearchResult ? parseFloat(selectedSearchResult.imdbRating || '0') || null : null,
          external_synopsis: selectedSearchResult ? selectedMedia.plot || null : null,
          external_url: selectedSearchResult ? selectedSearchResult.externalUrl || null : null,
          api_source: selectedSearchResult ? 'omdb' : 'manual',
          position: 1, // Default position
        }));

        console.log('Inserting items:', items);

        const { error: addError } = await supabase
          .from('user_list_items')
          .insert(items);

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
          {!showFallbackSearch ? (
            <>
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

              {user && lists.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Can't find the right media?
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFallbackSearch(true)}
                    className="w-full"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search for different media
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Fallback Search Interface */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowFallbackSearch(false)}
                  >
                    ← Back
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Search for the correct media
                  </div>
                </div>

                <Card className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>No compatible media found for "{mediaTitle}"</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      Search below to find the correct media to add to your lists.
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Input
                    placeholder="Search for movies or TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={searchLoading || !searchQuery.trim()}
                  >
                    {searchLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchPerformed && (
                  <div className="space-y-3">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="text-sm font-medium">
                          Found {searchResults.length} results:
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {searchResults.map((result) => (
                            <Card 
                              key={result.id}
                              className={`cursor-pointer transition-colors ${
                                selectedSearchResult?.id === result.id
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleSearchResultSelect(result)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-3">
                                  {selectedSearchResult?.id === result.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                  {result.poster && (
                                    <img
                                      src={result.poster}
                                      alt={result.title}
                                      className="w-12 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm truncate">{result.title}</h4>
                                      {result.year && (
                                        <Badge variant="outline" className="text-xs">
                                          {result.year}
                                        </Badge>
                                      )}
                                    </div>
                                    {result.imdbRating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="h-3 w-3 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground">
                                          {result.imdbRating}
                                        </span>
                                      </div>
                                    )}
                                    {result.plot && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {result.plot}
                                      </p>
                                    )}
                                    {result.externalUrl && (
                                      <a 
                                        href={result.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        IMDb
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                          <Search className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No results found. Try a different search term.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* List Selection for Search Results */}
                {selectedSearchResult && lists.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-muted-foreground mb-3">
                      Add "{selectedSearchResult.title}" to lists:
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
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
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
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
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
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