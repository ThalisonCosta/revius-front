'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Heart, Star, TrendingUp, Clock, UserPlus, Filter } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { ContentRating } from '@/types/content'
import { socialApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useAuthStore } from '@/stores/auth-store'

interface CommunityPageState {
  activities: ActivityItem[]
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ActivityItem {
  id: string
  type: 'rating' | 'review' | 'list' | 'follow'
  user: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  content?: {
    id: string
    title: string
    category: string
    imageUrl: string
  }
  rating?: number
  review?: string
  timestamp: string
  likes: number
  isLiked: boolean
}

interface CommunityFilters {
  type: 'all' | 'ratings' | 'reviews' | 'lists' | 'follows'
  timeframe: 'today' | 'week' | 'month' | 'all'
}

const ITEMS_PER_PAGE = 20

// Mock data for development
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'rating',
    user: {
      id: 'user1',
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    },
    content: {
      id: 'movie1',
      title: 'The Dark Knight',
      category: 'movie',
      imageUrl: 'https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    },
    rating: 5,
    review: 'Absolutely brilliant! Heath Ledger\'s performance as the Joker is phenomenal.',
    timestamp: '2024-01-15T14:30:00Z',
    likes: 23,
    isLiked: false,
  },
  {
    id: '2',
    type: 'rating',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    },
    content: {
      id: 'book1',
      title: 'The Fellowship of the Ring',
      category: 'book',
      imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/0547928211.01.MZZZZZZZ.jpg',
    },
    rating: 4.5,
    review: 'Tolkien\'s world-building is unmatched. A true masterpiece of fantasy literature.',
    timestamp: '2024-01-15T12:15:00Z',
    likes: 45,
    isLiked: true,
  },
  {
    id: '3',
    type: 'follow',
    user: {
      id: 'user3',
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    },
    timestamp: '2024-01-15T10:45:00Z',
    likes: 0,
    isLiked: false,
  },
]

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const { isAuthenticated } = useAuthStore()
  const [isLiked, setIsLiked] = useState(activity.isLiked)
  const [likesCount, setLikesCount] = useState(activity.likes)

  const handleLikeToggle = async () => {
    if (!isAuthenticated) return

    try {
      if (isLiked) {
        // await socialApi.unlikeRating(activity.id)
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        // await socialApi.likeRating(activity.id)
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 hover:shadow-md dark:hover:shadow-dark-700/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <img
          src={activity.user.avatar || `https://ui-avatars.com/api/?name=${activity.user.name}&background=6366f1&color=fff`}
          alt={activity.user.name}
          className="w-10 h-10 rounded-full"
        />
        
        <div className="flex-1 min-w-0">
          {/* User info and action */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {activity.user.name}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              @{activity.user.username}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-sm">
              •
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>

          {/* Activity content */}
          {activity.type === 'rating' && activity.content && (
            <div className="flex items-start space-x-3">
              <img
                src={activity.content.imageUrl}
                alt={activity.content.title}
                className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    rated
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activity.content.title}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-xs rounded-full text-gray-600 dark:text-gray-300 capitalize">
                    {activity.content.category}
                  </span>
                </div>
                
                {activity.rating && (
                  <div className="flex items-center space-x-1 mb-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${
                          index < Math.floor(activity.rating!)
                            ? 'text-yellow-400 fill-current'
                            : index < activity.rating!
                            ? 'text-yellow-400 fill-current opacity-50'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
                      {activity.rating}
                    </span>
                  </div>
                )}

                {activity.review && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                    {activity.review}
                  </p>
                )}
              </div>
            </div>
          )}

          {activity.type === 'follow' && (
            <div className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-600 dark:text-gray-400">started following</span>
              <span className="font-medium ml-1">3 new users</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {activity.type === 'rating' && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLikeToggle}
              disabled={!isAuthenticated}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isLiked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function CommunityPageContent() {
  const { isAuthenticated } = useAuthStore()
  const [state, setState] = useState<CommunityPageState>({
    activities: [],
    isLoading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
  
  const [filters, setFilters] = useState<CommunityFilters>({
    type: 'all',
    timeframe: 'week',
  })

  const loadActivities = async (newFilters: CommunityFilters, page = 1) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await socialApi.getActivityFeed(page, ITEMS_PER_PAGE)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockActivities,
        pagination: {
          page: page,
          limit: ITEMS_PER_PAGE,
          total: mockActivities.length,
          totalPages: Math.ceil(mockActivities.length / ITEMS_PER_PAGE),
          hasNext: page < Math.ceil(mockActivities.length / ITEMS_PER_PAGE),
          hasPrev: page > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        activities: mockResponse.data,
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load community activities'
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
    loadActivities(filters)
  }, [])

  const handleFilterChange = (newFilters: Partial<CommunityFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    loadActivities(updatedFilters, 1)
  }

  const handlePageChange = (page: number) => {
    loadActivities(filters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadActivities(filters, state.currentPage)
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
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-xl">
                  <Users className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Community
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    See what the community is rating, reviewing, and discussing
                  </p>
                </div>
              </div>

              {!isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary px-4 py-2 flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Community</span>
                </motion.button>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  12.5K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Members
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  89K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Reviews Posted
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  156K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ratings Given
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  2.3K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Lists Created
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Activity Type Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activity:
                  </span>
                  <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                    {[
                      { value: 'all', label: 'All', icon: TrendingUp },
                      { value: 'ratings', label: 'Ratings', icon: Star },
                      { value: 'reviews', label: 'Reviews', icon: MessageCircle },
                      { value: 'follows', label: 'Follows', icon: UserPlus },
                    ].map(option => {
                      const Icon = option.icon
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFilterChange({ type: option.value as CommunityFilters['type'] })}
                          className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded transition-colors ${
                            filters.type === option.value
                              ? 'bg-white dark:bg-dark-600 text-pink-600 dark:text-pink-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{option.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Timeframe Filter */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Time:
                  </span>
                  <select
                    value={filters.timeframe}
                    onChange={(e) => handleFilterChange({ timeframe: e.target.value as CommunityFilters['timeframe'] })}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Activity Feed */}
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
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                        </div>
                        <div className="flex space-x-3">
                          <div className="w-16 h-24 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                            <div className="h-3 w-full bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : state.activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  No activity found
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {isAuthenticated 
                    ? 'Follow more users to see their activities here'
                    : 'Join the community to participate in discussions'
                  }
                </div>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-6 mb-8"
              >
                {state.activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
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

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading community...</div>
      </div>
    </div>}>
      <CommunityPageContent />
    </Suspense>
  )
}