'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, FilterIcon } from 'lucide-react'
import { ContentGrid } from '@/components/content/content-grid'
import { ContentFilters } from '@/components/content/content-filters'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { Game, SearchFilters } from '@/types/content'
import { contentApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'

interface GamesPageState {
  games: Game[]
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
const mockGames: Game[] = [
  {
    id: '1',
    title: 'The Witcher 3: Wild Hunt',
    originalTitle: 'The Witcher 3: Wild Hunt',
    description: 'As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy, a living weapon that can alter the shape of the world.',
    imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
    backdropUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/scz0zk.jpg',
    releaseDate: '2015-05-19',
    genres: ['RPG', 'Adventure', 'Action'],
    category: 'game',
    developers: ['CD Projekt Red'],
    publishers: ['CD Projekt'],
    platforms: ['PC', 'PlayStation 4', 'Xbox One', 'Nintendo Switch'],
    engine: 'REDengine 3',
    modes: ['single-player'],
    esrbRating: 'M',
    externalIds: {
      igdb: '1942',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Red Dead Redemption 2',
    originalTitle: 'Red Dead Redemption 2',
    description: 'America, 1899. The end of the Wild West era has begun. After a robbery goes badly wrong in the western town of Blackwater, Arthur Morgan and the Van der Linde gang are forced to flee.',
    imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
    backdropUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/sctjw3.jpg',
    releaseDate: '2018-10-26',
    genres: ['Action', 'Adventure'],
    category: 'game',
    developers: ['Rockstar Studios'],
    publishers: ['Rockstar Games'],
    platforms: ['PC', 'PlayStation 4', 'Xbox One', 'Stadia'],
    modes: ['single-player', 'multiplayer'],
    esrbRating: 'M',
    externalIds: {
      igdb: '25076',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Cyberpunk 2077',
    originalTitle: 'Cyberpunk 2077',
    description: 'Cyberpunk 2077 is an open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.',
    imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
    backdropUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/scz0zq.jpg',
    releaseDate: '2020-12-10',
    genres: ['RPG', 'Action'],
    category: 'game',
    developers: ['CD Projekt Red'],
    publishers: ['CD Projekt'],
    platforms: ['PC', 'PlayStation 4', 'PlayStation 5', 'Xbox One', 'Xbox Series X|S'],
    engine: 'REDengine 4',
    modes: ['single-player'],
    esrbRating: 'M',
    externalIds: {
      igdb: '1877',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

function GamesPageContent() {
  const [state, setState] = useState<GamesPageState>({
    games: [],
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
    category: 'game',
    page: 1,
    limit: ITEMS_PER_PAGE,
    sortBy: 'popularity',
    sortOrder: 'desc',
  })

  const loadGames = async (newFilters: SearchFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await contentApi.getContent('game', newFilters)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockGames,
        pagination: {
          page: newFilters.page || 1,
          limit: newFilters.limit || ITEMS_PER_PAGE,
          total: mockGames.length,
          totalPages: Math.ceil(mockGames.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasNext: (newFilters.page || 1) < Math.ceil(mockGames.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasPrev: (newFilters.page || 1) > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        games: mockResponse.data as Game[],
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        totalResults: mockResponse.pagination.total,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load games'
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
    loadGames(filters)
  }, [])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
      category: 'game' as const,
    }
    setFilters(updatedFilters)
    loadGames(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    loadGames(updatedFilters)
    
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadGames(filters)
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
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <Gamepad2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Games
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Explore and rate video games across all platforms
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {state.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Games
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  25
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Platforms
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  4.4★
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  2024
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Latest Year
                </div>
              </div>
            </motion.div>

            {/* Popular Platforms */}
            <motion.div variants={fadeInUp} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {['PC', 'PlayStation 5', 'Xbox Series X|S', 'Nintendo Switch', 'PlayStation 4', 'Xbox One', 'Mobile', 'VR'].map(platform => (
                  <motion.button
                    key={platform}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    {platform}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Popular Genres */}
            <motion.div variants={fadeInUp} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Action', 'RPG', 'Strategy', 'Indie', 'Adventure', 'Simulation', 'Sports', 'Racing', 'FPS', 'Fighting'].map(genre => (
                  <motion.button
                    key={genre}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    {genre}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Filter Toggle */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Browse Games
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
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
                category="game"
                className="mb-6"
              />
            </motion.div>
          </motion.div>

          {/* Games Grid */}
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
                content={state.games}
                isLoading={state.isLoading}
                category="game"
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

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading games...</div>
      </div>
    </div>}>
      <GamesPageContent />
    </Suspense>
  )
}