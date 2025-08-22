import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Film, FilterIcon } from 'lucide-react'
import { ContentGrid } from '@/components/content/content-grid'
import { ContentFilters } from '@/components/content/content-filters'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { Movie, SearchFilters } from '@/types/content'
import { contentApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'

interface MoviesPageState {
  movies: Movie[]
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  totalResults: number
}

const ITEMS_PER_PAGE = 20

// Mock data for development - will be replaced with real API calls
const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    imageUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/hkuWvqyaOc3t7CmgpjDS1J7PRME.jpg',
    releaseDate: '2008-07-18',
    genres: ['Action', 'Crime', 'Drama'],
    category: 'movie',
    director: ['Christopher Nolan'],
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
    runtime: 152,
    language: 'en',
    countries: ['US'],
    certification: 'PG-13',
    externalIds: {
      imdb: 'tt0468569',
      tmdb: '155',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Add more mock movies as needed
]

export default function MoviesPage() {
  const [state, setState] = useState<MoviesPageState>({
    movies: [],
    isLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalResults: 0,
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'movie',
    page: 1,
    limit: ITEMS_PER_PAGE,
    sortBy: 'popularity',
    sortOrder: 'desc',
  })

  const loadMovies = async (newFilters: SearchFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await contentApi.getContent('movie', newFilters)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockMovies,
        pagination: {
          page: newFilters.page || 1,
          limit: newFilters.limit || ITEMS_PER_PAGE,
          total: mockMovies.length,
          totalPages: Math.ceil(mockMovies.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasNext: (newFilters.page || 1) < Math.ceil(mockMovies.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasPrev: (newFilters.page || 1) > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        movies: mockResponse.data as Movie[],
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        totalResults: mockResponse.pagination.total,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load movies'
      if (error instanceof ApiError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }))
    }
  }

  useEffect(() => {
    loadMovies(filters)
  }, [])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
      category: 'movie' as const,
    }
    setFilters(updatedFilters)
    loadMovies(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    loadMovies(updatedFilters)
    
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadMovies(filters)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <AnimatedWrapper>
          {/* Header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-8"
          >
            <motion.div variants={fadeInUp} className="flex items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
                  <Film className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Movies
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover and rate your favorite movies
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {state.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Movies
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  2024
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Latest Year
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  4.2★
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>
            </motion.div>

            {/* Filter Toggle */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Browse Movies
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </motion.button>
            </motion.div>

            {/* Filters */}
            <motion.div variants={fadeInUp}>
              <ContentFilters
                isOpen={showFilters}
                onFiltersChange={handleFiltersChange}
                category="movie"
                className="mb-6"
              />
            </motion.div>
          </motion.div>

          {/* Movies Grid */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
          >
            {state.error ? (
              <div className="text-center py-12">
                <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-4">
                  {state.error}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry}
                  className="btn-primary px-6 py-2"
                >
                  Try Again
                </motion.button>
              </div>
            ) : (
              <ContentGrid
                content={state.movies}
                isLoading={state.isLoading}
                category="movie"
                showViewToggle={true}
                showFilters={false}
                className="mb-8"
              />
            )}
          </motion.div>

          {/* Pagination */}
          {!state.isLoading && !state.error && state.totalPages > 1 && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="flex justify-center"
            >
              <Pagination
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                hasNext={state.hasNext}
                hasPrev={state.hasPrev}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            </motion.div>
          )}
        </AnimatedWrapper>
      </div>
    </div>
  )
}