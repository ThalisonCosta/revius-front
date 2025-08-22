'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { List, Plus, FilterIcon, Users, Lock, Globe, Heart, Star, Calendar } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { ContentList } from '@/types/content'
import { listsApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useAuthStore } from '@/stores/auth-store'

interface ListsPageState {
  lists: ContentList[]
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  totalResults: number
}

interface ListFilters {
  type: 'all' | 'my' | 'public' | 'following'
  sortBy: 'created' | 'updated' | 'followers' | 'name'
  sortOrder: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 12

// Mock data for development - will be replaced with real API calls
const mockLists: ContentList[] = [
  {
    id: '1',
    name: 'Best Sci-Fi Movies of All Time',
    description: 'A curated list of the greatest science fiction films ever made, from classics to modern masterpieces.',
    userId: 'user1',
    isPublic: true,
    items: [
      { contentId: 'movie1', addedAt: '2024-01-15T10:00:00Z', note: 'Mind-bending masterpiece' },
      { contentId: 'movie2', addedAt: '2024-01-14T15:30:00Z' },
      { contentId: 'movie3', addedAt: '2024-01-13T09:15:00Z' },
    ],
    followers: 156,
    isFollowing: false,
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Fantasy Book Series to Read',
    description: 'Epic fantasy series that will transport you to other worlds.',
    userId: 'user2',
    isPublic: true,
    items: [
      { contentId: 'book1', addedAt: '2024-01-12T14:20:00Z' },
      { contentId: 'book2', addedAt: '2024-01-11T11:45:00Z' },
    ],
    followers: 89,
    isFollowing: true,
    createdAt: '2024-01-08T16:30:00Z',
    updatedAt: '2024-01-12T14:20:00Z',
  },
  {
    id: '3',
    name: 'Indie Games Worth Playing',
    description: 'Hidden gems from independent developers.',
    userId: 'user3',
    isPublic: true,
    items: [
      { contentId: 'game1', addedAt: '2024-01-14T18:00:00Z' },
      { contentId: 'game2', addedAt: '2024-01-13T20:30:00Z' },
      { contentId: 'game3', addedAt: '2024-01-12T22:15:00Z' },
      { contentId: 'game4', addedAt: '2024-01-11T19:45:00Z' },
    ],
    followers: 234,
    isFollowing: false,
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-01-14T18:00:00Z',
  },
]

function ListCard({ list }: { list: ContentList }) {
  const { isAuthenticated } = useAuthStore()
  const [isFollowing, setIsFollowing] = useState(list.isFollowing || false)

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return
    }

    try {
      if (isFollowing) {
        // await listsApi.unfollowList(list.id)
        setIsFollowing(false)
      } else {
        // await listsApi.followList(list.id)
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-md dark:hover:shadow-dark-700/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {list.name}
          </h3>
          <div className="flex items-center text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
            {list.isPublic ? (
              <Globe className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </div>
        </div>
        
        {list.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
            {list.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <List className="w-4 h-4 mr-1" />
              {list.items.length} items
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {list.followers} followers
            </span>
          </div>
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(list.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700/50 border-t border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
          >
            View Details
          </motion.button>
          
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollowToggle}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50'
              }`}
            >
              <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
              {isFollowing ? 'Following' : 'Follow'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ListsPageContent() {
  const { isAuthenticated } = useAuthStore()
  const [state, setState] = useState<ListsPageState>({
    lists: [],
    isLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalResults: 0,
  })
  
  const [filters, setFilters] = useState<ListFilters>({
    type: 'all',
    sortBy: 'updated',
    sortOrder: 'desc',
  })

  const loadLists = async (newFilters: ListFilters, page = 1) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await listsApi.getLists(undefined, page, ITEMS_PER_PAGE)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockLists,
        pagination: {
          page: page,
          limit: ITEMS_PER_PAGE,
          total: mockLists.length,
          totalPages: Math.ceil(mockLists.length / ITEMS_PER_PAGE),
          hasNext: page < Math.ceil(mockLists.length / ITEMS_PER_PAGE),
          hasPrev: page > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        lists: mockResponse.data,
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        totalResults: mockResponse.pagination.total,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load lists'
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
    loadLists(filters)
  }, [])

  const handleFilterChange = (newFilters: Partial<ListFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    loadLists(updatedFilters, 1)
  }

  const handlePageChange = (page: number) => {
    loadLists(filters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadLists(filters, state.currentPage)
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
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                  <List className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Lists
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover curated collections of movies, books, games, and TV shows
                  </p>
                </div>
              </div>

              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary px-4 py-2 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create List</span>
                </motion.button>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {state.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Lists
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  1.2K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Public Lists
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  89K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Items
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  567
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Curators
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show:
                  </span>
                  <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                    {[
                      { value: 'all', label: 'All Lists' },
                      { value: 'public', label: 'Public' },
                      ...(isAuthenticated ? [
                        { value: 'my', label: 'My Lists' },
                        { value: 'following', label: 'Following' }
                      ] : [])
                    ].map(option => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleFilterChange({ type: option.value as ListFilters['type'] })}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          filters.type === option.value
                            ? 'bg-white dark:bg-dark-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort by:
                  </span>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [ListFilters['sortBy'], ListFilters['sortOrder']]
                      handleFilterChange({ sortBy, sortOrder })
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="updated-desc">Recently Updated</option>
                    <option value="created-desc">Newest</option>
                    <option value="followers-desc">Most Followed</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Lists Grid */}
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
            ) : state.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700/50 border-t border-gray-200 dark:border-dark-700">
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                        <div className="h-8 w-16 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : state.lists.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  No lists found
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {isAuthenticated ? 'Create your first list to get started' : 'Sign in to create and follow lists'}
                </div>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {state.lists.map((list) => (
                  <ListCard key={list.id} list={list} />
                ))}
              </motion.div>
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

export default function ListsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading lists...</div>
      </div>
    </div>}>
      <ListsPageContent />
    </Suspense>
  )
}