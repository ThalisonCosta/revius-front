'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Content, ContentCategory } from '@/types/content'
import { ContentCard } from './content-card'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { GridIcon, ListIcon, FilterIcon, SortAscIcon } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

interface ContentGridProps {
  /** Array of content items to display */
  content: Content[]
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Content category for filtering */
  category?: ContentCategory | 'all'
  /** Show view mode toggle */
  showViewToggle?: boolean
  /** Show filters */
  showFilters?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Reusable content grid component with view modes and filtering
 */
export function ContentGrid({
  content,
  isLoading = false,
  error = null,
  category = 'all',
  showViewToggle = true,
  showFilters = true,
  className = '',
}: ContentGridProps) {
  const { viewMode, setViewMode, sortBy, sortOrder, setSortBy, setSortOrder } = useUIStore()
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'rating', label: 'Rating' },
    { value: 'date', label: 'Release Date' },
    { value: 'popularity', label: 'Popularity' },
  ]

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-2">
          Something went wrong
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {error}
        </div>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for controls */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-20 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Loading skeleton for grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-dark-700 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          No content found
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Try adjusting your filters or search terms
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {content.length} {content.length === 1 ? 'result' : 'results'}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
              setSortBy(newSortBy)
              setSortOrder(newSortOrder)
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map(option => (
              <optgroup key={option.value} label={option.label}>
                <option value={`${option.value}-asc`}>
                  {option.label} (A-Z)
                </option>
                <option value={`${option.value}-desc`}>
                  {option.label} (Z-A)
                </option>
              </optgroup>
            ))}
          </select>

          {/* Filters Toggle */}
          {showFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showFilterPanel
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FilterIcon className="w-4 h-4" />
            </motion.button>
          )}

          {/* View Mode Toggle */}
          {showViewToggle && (
            <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <GridIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid/List */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {content.map((item, index) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                custom={index}
              >
                <ContentCard content={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="space-y-4"
          >
            {content.map((item, index) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                custom={index}
                className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md dark:hover:shadow-dark-700/50 transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-24">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                    {item.originalTitle && item.originalTitle !== item.title && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.originalTitle}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(item.releaseDate).getFullYear()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.genres.slice(0, 3).map(genre => (
                        <span
                          key={genre}
                          className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                      {item.genres.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-full">
                          +{item.genres.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}