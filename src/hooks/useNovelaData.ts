import { useState, useEffect, useMemo } from 'react';

export interface Novela {
  id: string;
  title: string;
  country: string;
  broadcaster: string;
  year: {
    start: number;
    end?: number;
  } | null;
  genre: string[];
  synopsis: string;
  cast: string[];
  episodes: number;
  director: string;
  author: string;
  wikipediaUrl: string;
  imageUrl: string;
  scraped: string;
}

export interface NovelasMetadata {
  lastUpdated: string;
  totalNovelas: number;
  countries: string[];
  broadcasters: string[];
  genres: string[];
  statistics: {
    totalEpisodes: number;
    averageEpisodes: number;
    yearRange: string;
    oldestYear: number | null;
    newestYear: number | null;
  };
  scrapedAt: string;
}

export interface NovelasData {
  metadata: NovelasMetadata;
  novelas: Novela[];
}

interface UseNovelaDataOptions {
  searchQuery?: string;
  countryFilter?: string;
  broadcasterFilter?: string;
  genreFilter?: string;
  yearFilter?: number;
  sortBy?: 'title' | 'year' | 'episodes' | 'country';
  sortOrder?: 'asc' | 'desc';
}

export function useNovelaData(options: UseNovelaDataOptions = {}) {
  const [data, setData] = useState<NovelasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    countryFilter = '',
    broadcasterFilter = '',
    genreFilter = '',
    yearFilter,
    sortBy = 'title',
    sortOrder = 'asc'
  } = options;

  // Load data from JSON file
  useEffect(() => {
    const loadNovelaData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load main data file first, fallback to sample
        let response: Response;
        try {
          response = await fetch('/data/novelas.json');
          if (!response.ok) {
            throw new Error('Main file not found');
          }
        } catch {
          // Fallback to sample data
          response = await fetch('/data/novelas-sample.json');
          if (!response.ok) {
            throw new Error('Sample file not found');
          }
        }

        const jsonData: NovelasData = await response.json();
        
        // Validate data structure
        if (!jsonData.novelas || !Array.isArray(jsonData.novelas)) {
          throw new Error('Invalid data structure');
        }

        setData(jsonData);
      } catch (err) {
        console.error('Error loading novela data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadNovelaData();
  }, []);

  // Filter and sort novelas based on options
  const filteredNovelas = useMemo(() => {
    if (!data?.novelas) return [];

    let filtered = [...data.novelas];

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(novela =>
        novela.title.toLowerCase().includes(query) ||
        novela.synopsis.toLowerCase().includes(query) ||
        novela.cast.some(actor => actor.toLowerCase().includes(query)) ||
        novela.director.toLowerCase().includes(query) ||
        novela.author.toLowerCase().includes(query)
      );
    }

    // Apply country filter
    if (countryFilter) {
      filtered = filtered.filter(novela => novela.country === countryFilter);
    }

    // Apply broadcaster filter
    if (broadcasterFilter) {
      filtered = filtered.filter(novela => novela.broadcaster === broadcasterFilter);
    }

    // Apply genre filter
    if (genreFilter) {
      filtered = filtered.filter(novela => 
        novela.genre.some(g => g.toLowerCase() === genreFilter.toLowerCase())
      );
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(novela => {
        if (!novela.year) return false;
        const startYear = novela.year.start;
        const endYear = novela.year.end || startYear;
        return yearFilter >= startYear && yearFilter <= endYear;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'year':
          aValue = a.year?.start || 0;
          bValue = b.year?.start || 0;
          break;
        case 'episodes':
          aValue = a.episodes || 0;
          bValue = b.episodes || 0;
          break;
        case 'country':
          aValue = a.country.toLowerCase();
          bValue = b.country.toLowerCase();
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data?.novelas, searchQuery, countryFilter, broadcasterFilter, genreFilter, yearFilter, sortBy, sortOrder]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    if (!data?.novelas) {
      return {
        countries: [],
        broadcasters: [],
        genres: [],
        years: []
      };
    }

    const countries = [...new Set(data.novelas.map(n => n.country))].sort();
    const broadcasters = [...new Set(data.novelas.map(n => n.broadcaster))].sort();
    const genres = [...new Set(data.novelas.flatMap(n => n.genre))].sort();
    const years = [...new Set(data.novelas
      .map(n => n.year?.start)
      .filter(year => year !== undefined)
      .sort((a, b) => b! - a!)
    )];

    return { countries, broadcasters, genres, years };
  }, [data?.novelas]);

  // Get random novelas for recommendations
  const getRandomNovelas = (count: number = 6): Novela[] => {
    if (!data?.novelas) return [];
    
    const shuffled = [...data.novelas].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Get novelas by country
  const getNovelasByCountry = (country: string): Novela[] => {
    if (!data?.novelas) return [];
    return data.novelas.filter(novela => novela.country === country);
  };

  // Get popular novelas (by episode count as proxy)
  const getPopularNovelas = (count: number = 10): Novela[] => {
    if (!data?.novelas) return [];
    
    return [...data.novelas]
      .sort((a, b) => (b.episodes || 0) - (a.episodes || 0))
      .slice(0, count);
  };

  // Get recent novelas (by year)
  const getRecentNovelas = (count: number = 10): Novela[] => {
    if (!data?.novelas) return [];
    
    return [...data.novelas]
      .filter(novela => novela.year?.start)
      .sort((a, b) => (b.year?.start || 0) - (a.year?.start || 0))
      .slice(0, count);
  };

  return {
    // Data
    data,
    novelas: filteredNovelas,
    metadata: data?.metadata,
    
    // State
    loading,
    error,
    
    // Filter options
    filterOptions,
    
    // Utility functions
    getRandomNovelas,
    getNovelasByCountry,
    getPopularNovelas,
    getRecentNovelas,
    
    // Stats
    totalResults: filteredNovelas.length,
    totalNovelas: data?.metadata.totalNovelas || 0
  };
}

// Hook specifically for search functionality
export function useNovelaSearch(initialQuery: string = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    country: '',
    broadcaster: '',
    genre: '',
    year: undefined as number | undefined,
  });
  const [sorting, setSorting] = useState<{
    sortBy: 'title' | 'year' | 'episodes' | 'country';
    sortOrder: 'asc' | 'desc';
  }>({
    sortBy: 'year',
    sortOrder: 'desc'
  });

  const { novelas, loading, error, filterOptions, totalResults } = useNovelaData({
    searchQuery,
    countryFilter: filters.country,
    broadcasterFilter: filters.broadcaster,
    genreFilter: filters.genre,
    yearFilter: filters.year,
    ...sorting
  });

  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateSorting = (sortBy: 'title' | 'year' | 'episodes' | 'country', sortOrder?: 'asc' | 'desc') => {
    setSorting(prev => ({
      sortBy,
      sortOrder: sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc')
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      country: '',
      broadcaster: '',
      genre: '',
      year: undefined,
    });
    setSorting({
      sortBy: 'year',
      sortOrder: 'desc'
    });
  };

  return {
    // Results
    novelas,
    loading,
    error,
    totalResults,
    
    // Search state
    searchQuery,
    setSearchQuery,
    filters,
    sorting,
    
    // Filter options
    filterOptions,
    
    // Actions
    updateFilter,
    updateSorting,
    clearFilters,
  };
}