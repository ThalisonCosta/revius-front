import { useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { MediaCard } from "@/components/MediaCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, Globe, Tv, Calendar, BarChart } from "lucide-react";
import { useNovelaSearch } from "@/hooks/useNovelaData";
import { useDebounce } from "@/hooks/useDebounce";

export default function Novelas() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const {
    novelas,
    loading,
    error,
    totalResults,
    searchQuery,
    setSearchQuery,
    filters,
    sorting,
    filterOptions,
    updateFilter,
    updateSorting,
    clearFilters
  } = useNovelaSearch(debouncedSearch);

  // Update search when debounced input changes
  if (searchQuery !== debouncedSearch) {
    setSearchQuery(debouncedSearch);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleQuickFilter = (type: string, value: string) => {
    if (type === 'country') {
      updateFilter('country', filters.country === value ? '' : value);
    } else if (type === 'genre') {
      updateFilter('genre', filters.genre === value ? '' : value);
    } else if (type === 'clear') {
      clearFilters();
      setSearchInput('');
    }
  };

  const getYear = (novela: {year?: {start: number}}) => {
    return novela.year?.start || undefined;
  };

  const formatEpisodes = (episodes: number) => {
    if (episodes <= 20) return `${episodes} episódios`;
    if (episodes <= 50) return `${episodes} eps`;
    return `${episodes} capítulos`;
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Erro ao carregar dados</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Execute o scraper primeiro: <code>npm run scrape:novelas</code>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-primary bg-clip-text text-transparent">Novelas</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Descubra telenovelas do Brasil, México, Coreia do Sul e outros países
          </p>
          {totalResults > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {totalResults} novela{totalResults !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar novelas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {/* Advanced Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={filters.country} onValueChange={(value) => updateFilter('country', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {filterOptions.countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.broadcaster} onValueChange={(value) => updateFilter('broadcaster', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Emissora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as emissoras</SelectItem>
                {filterOptions.broadcasters.map(broadcaster => (
                  <SelectItem key={broadcaster} value={broadcaster}>
                    {broadcaster}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gêneros</SelectItem>
                {filterOptions.genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={sorting.sortBy} 
              onValueChange={(value: 'title' | 'year' | 'episodes' | 'country') => updateSorting(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="episodes">Episódios</SelectItem>
                <SelectItem value="country">País</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Filter badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={!filters.country && !filters.broadcaster && !filters.genre ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth"
              onClick={() => handleQuickFilter('clear', '')}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Todas
            </Badge>
            
            {filterOptions.countries.slice(0, 4).map(country => (
              <Badge 
                key={country}
                variant={filters.country === country ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
                onClick={() => handleQuickFilter('country', country)}
              >
                <Globe className="h-3 w-3 mr-1" />
                {country}
              </Badge>
            ))}
            
            <Badge 
              variant={filters.genre === 'Drama' ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleQuickFilter('genre', 'Drama')}
            >
              <Filter className="h-3 w-3 mr-1" />
              Drama
            </Badge>
            <Badge 
              variant={filters.genre === 'Romance' ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleQuickFilter('genre', 'Romance')}
            >
              <Filter className="h-3 w-3 mr-1" />
              Romance
            </Badge>
            <Badge 
              variant={filters.genre === 'Comédia' ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => handleQuickFilter('genre', 'Comédia')}
            >
              <Filter className="h-3 w-3 mr-1" />
              Comédia
            </Badge>
          </div>

          {/* Active Filters Display */}
          {(filters.country || filters.broadcaster || filters.genre || searchQuery) && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {filters.country && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('country', '')}>
                  País: {filters.country} ✕
                </Badge>
              )}
              {filters.broadcaster && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('broadcaster', '')}>
                  Emissora: {filters.broadcaster} ✕
                </Badge>
              )}
              {filters.genre && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('genre', '')}>
                  Gênero: {filters.genre} ✕
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => {setSearchQuery(''); setSearchInput('');}}>
                  Busca: "{searchQuery}" ✕
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Novelas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {novelas.map((novela) => (
            <MediaCard
              key={novela.id}
              id={novela.id}
              title={novela.title}
              poster={novela.imageUrl}
              year={getYear(novela)}
              rating={undefined} // Novelas don't have ratings in our data
              genre={novela.genre}
              type="novela"
              synopsis={novela.synopsis}
              externalUrl={novela.wikipediaUrl}
              customBadge={
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {novela.country}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Tv className="h-3 w-3 mr-1" />
                    {novela.broadcaster}
                  </Badge>
                  {novela.episodes > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <BarChart className="h-3 w-3 mr-1" />
                      {formatEpisodes(novela.episodes)}
                    </Badge>
                  )}
                </div>
              }
            />
          ))}
        </div>

        {/* Empty State */}
        {!loading && novelas.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">Nenhuma novela encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filters.country || filters.broadcaster || filters.genre
                ? 'Tente ajustar os filtros de busca'
                : 'Execute o scraper para coletar dados das novelas'
              }
            </p>
            {(!searchQuery && !filters.country && !filters.broadcaster && !filters.genre) && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Para coletar novelas, execute:</p>
                <code className="bg-muted p-2 rounded text-sm">npm run scrape:novelas</code>
              </div>
            )}
            {(searchQuery || filters.country || filters.broadcaster || filters.genre) && (
              <Button onClick={clearFilters} variant="outline">
                Limpar filtros
              </Button>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}