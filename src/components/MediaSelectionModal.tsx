import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ExternalLink, Calendar, Star } from 'lucide-react';
import { SearchResult } from '@/hooks/useGlobalSearch';

interface MediaMatch {
  originalTitle: string;
  originalYear?: number;
  matches: SearchResult[];
}

interface MediaSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaMatch: MediaMatch | null;
  onSelect: (selectedMedia: SearchResult | null) => void;
  onSkip: () => void;
  onSearchMore: (query: string) => Promise<SearchResult[]>;
}

export function MediaSelectionModal({
  open,
  onOpenChange,
  mediaMatch,
  onSelect,
  onSkip,
  onSearchMore
}: MediaSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await onSearchMore(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (media: SearchResult) => {
    onSelect(media);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSkip = () => {
    onSkip();
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderMediaCard = (media: SearchResult, isFromSearch = false) => (
    <Card 
      key={media.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleSelect(media)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {media.poster ? (
              <img
                src={media.poster}
                alt={media.title}
                className="w-16 h-24 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{media.title}</h4>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {media.year}
              </div>
              
              {media.rating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  {media.rating.toFixed(1)}
                </div>
              )}
              
              <Badge variant="secondary" className="text-xs">
                {media.platform}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {media.genre.slice(0, 3).map((g) => (
                <Badge key={g} variant="outline" className="text-xs">
                  {g}
                </Badge>
              ))}
            </div>
            
            {media.synopsis && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {media.synopsis}
              </p>
            )}
            
            {media.externalUrl && (
              <div className="flex items-center gap-1 mt-2">
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs text-muted-foreground truncate">
                  {media.externalUrl}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!mediaMatch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Select the correct movie: {mediaMatch.originalTitle}
            {mediaMatch.originalYear && ` (${mediaMatch.originalYear})`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Automatic matches */}
          {mediaMatch.matches.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Found matches:</h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {mediaMatch.matches.map((media) => renderMediaCard(media))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Manual search */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Can't find it? Search manually:</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Search for the correct movie/show..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={!searchQuery.trim() || isSearching}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {searchResults.map((media) => renderMediaCard(media, true))}
                </div>
              </ScrollArea>
            )}
            
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleSkip}>
            Skip This Movie
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}