import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Film, Tv, BookOpen, Drama, Gamepad2, Star, Calendar, X } from 'lucide-react';
import { useListImporter, type SearchResult } from '@/hooks/useListImporter';
import { useDebounce } from '@/hooks/useDebounce';

interface ManualMediaSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: SearchResult) => void;
  onSkip: () => void;
  originalTitle: string;
  originalYear?: number;
  listId: string;
  itemId: string;
}

const typeIcons = {
  movie: Film,
  tv: Tv,
  novela: Drama,
  anime: BookOpen,
  manga: BookOpen,
  game: Gamepad2
};

export function ManualMediaSearchModal({
  open,
  onOpenChange,
  onSelect,
  onSkip,
  originalTitle,
  originalYear,
  listId,
  itemId
}: ManualMediaSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(originalTitle);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { searchForMedia, updateListItem } = useListImporter();

  // Debounce search query for better UX
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchForMedia(query, originalYear);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchForMedia, originalYear]);

  // Perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  const handleSelect = useCallback(async (media: SearchResult) => {
    try {
      const success = await updateListItem(listId, itemId, media);
      if (success) {
        onSelect(media);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }, [listId, itemId, updateListItem, onSelect, onOpenChange]);

  const handleSkip = useCallback(() => {
    onSkip();
    onOpenChange(false);
  }, [onSkip, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isSearching) {
      onOpenChange(false);
    }
  }, [isSearching, onOpenChange]);

  const formatYear = (year: number) => {
    return new Date().getFullYear() >= year ? year.toString() : 'TBD';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Manual Media Search
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search for the correct match for "{originalTitle}" {originalYear && `(${originalYear})`}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="search">Search Query</Label>
            <Input
              id="search"
              placeholder="Type to search for movies, TV shows, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="w-full"
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isSearching ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex gap-3">
                      <Skeleton className="w-16 h-20 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result, index) => {
                  const TypeIcon = typeIcons[result.type] || Film;
                  return (
                    <Card 
                      key={`${result.id}-${index}`}
                      className="p-3 hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/30"
                      onClick={() => handleSelect(result)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-3">
                          {/* Poster */}
                          <div className="w-16 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                            {result.poster ? (
                              <img
                                src={result.poster}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <TypeIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                {result.title}
                              </h3>
                              {result.rating && (
                                <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{result.rating}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              {/* Year and Type */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {result.year && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatYear(result.year)}</span>
                                  </div>
                                )}
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {result.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.platform}
                                </Badge>
                              </div>

                              {/* Genres */}
                              {result.genre && result.genre.length > 0 && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {result.genre.slice(0, 3).join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : debouncedSearchQuery.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h4 className="font-medium mb-2">No Results Found</h4>
                <p className="text-sm">
                  Try adjusting your search terms or check the spelling
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h4 className="font-medium mb-2">Start Searching</h4>
                <p className="text-sm">
                  Enter a search term to find the correct media
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSearching}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}