'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Tv, FilterIcon } from 'lucide-react'
import { ContentGrid } from '@/components/content/content-grid'
import { ContentFilters } from '@/components/content/content-filters'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { TVShow, SearchFilters } from '@/types/content'
import { contentApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'

interface TVPageState {
  tvShows: TVShow[]
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
const mockTVShows: TVShow[] = [
  {
    id: '1',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
    imageUrl: 'https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/eSzpy96DwBujGFj0xMbXBcGcfxX.jpg',
    releaseDate: '2008-01-20',
    genres: ['Crime', 'Drama', 'Thriller'],
    category: 'tv',
    creators: ['Vince Gilligan'],
    cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn', 'Dean Norris'],
    seasons: 5,
    episodes: 62,
    status: 'ended',
    network: 'AMC',
    language: 'en',
    countries: ['US'],
    externalIds: {
      imdb: 'tt0903747',
      tmdb: '1396',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    imageUrl: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/suopoADq0k8YHr9VB6oP99Hbr4O.jpg',
    releaseDate: '2011-04-17',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    category: 'tv',
    creators: ['David Benioff', 'D. B. Weiss'],
    cast: ['Peter Dinklage', 'Lena Headey', 'Emilia Clarke', 'Kit Harington'],
    seasons: 8,
    episodes: 73,
    status: 'ended',
    network: 'HBO',
    language: 'en',
    countries: ['US'],
    externalIds: {
      imdb: 'tt0944947',
      tmdb: '1399',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

function TVPageContent() {
  const [state, setState] = useState<TVPageState>({
    tvShows: [],
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
    category: 'tv',
    page: 1,
    limit: ITEMS_PER_PAGE,
    sortBy: 'popularity',
    sortOrder: 'desc',
  })

  const loadTVShows = async (newFilters: SearchFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await contentApi.getContent('tv', newFilters)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockTVShows,
        pagination: {
          page: newFilters.page || 1,
          limit: newFilters.limit || ITEMS_PER_PAGE,
          total: mockTVShows.length,
          totalPages: Math.ceil(mockTVShows.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasNext: (newFilters.page || 1) < Math.ceil(mockTVShows.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasPrev: (newFilters.page || 1) > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        tvShows: mockResponse.data as TVShow[],
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        totalResults: mockResponse.pagination.total,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load TV shows'
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
    loadTVShows(filters)
  }, [])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
      category: 'tv' as const,
    }
    setFilters(updatedFilters)
    loadTVShows(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    loadTVShows(updatedFilters)
    
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadTVShows(filters)
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
                <div className="p-3 bg-accent-100 dark:bg-accent-900 rounded-xl">
                  <Tv className="w-8 h-8 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    TV Shows
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Explore and rate television series from around the world
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {state.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Shows
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  156
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Currently Airing
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  4.3★
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  2024
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Latest Year
                </div>
              </div>
            </motion.div>

            {/* Filter Toggle */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Browse TV Shows
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-accent-50 dark:bg-accent-900/50 border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300'
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
                category="tv"
                className="mb-6"
              />
            </motion.div>
          </motion.div>

          {/* TV Shows Grid */}
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
                content={state.tvShows}
                isLoading={state.isLoading}
                category="tv"
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

export default function TVPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading TV shows...</div>
      </div>
    </div>}>
      <TVPageContent />
    </Suspense>
  )
}