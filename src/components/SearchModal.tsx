import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/MediaCard";
import { Search, Filter, X } from "lucide-react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchModalProps {
  children: React.ReactNode;
}

export function SearchModal({ children }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year'>('relevance');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const { results, loading, searchContent, clearResults } = useGlobalSearch();
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchContent(debouncedQuery, sortBy);
    } else {
      clearResults();
    }
  }, [debouncedQuery, sortBy, searchContent, clearResults]);

  const filteredResults = results.filter(result => 
    selectedTypes.length === 0 || selectedTypes.includes(result.type)
  );

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSortBy('relevance');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Content
          </DialogTitle>
        </DialogHeader>

        {/* Search Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for movies, TV shows, anime, manga..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Types:</span>
              {["movie", "tv", "anime", "manga"].map((type) => (
                <Badge
                  key={type}
                  variant={selectedTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>

            {(selectedTypes.length > 0 || sortBy !== 'relevance') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && query.trim() && filteredResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {!loading && filteredResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredResults.length} results found
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredResults.map((item) => (
                  <div key={item.id} className="relative">
                    <MediaCard
                      title={item.title}
                      poster={item.poster}
                      year={item.year}
                      rating={item.rating}
                      genre={item.genre}
                      type={item.type}
                      id={item.id}
                      synopsis={item.synopsis}
                      externalUrl={item.externalUrl}
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-xs bg-background/80"
                    >
                      {item.platform}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              Start typing to search for movies, TV shows, anime, and manga...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}