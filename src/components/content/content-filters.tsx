'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ContentCategory, SearchFilters } from '@/types/content'
import { XIcon, ChevronDownIcon, CalendarIcon, StarIcon } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

interface ContentFiltersProps {
  /** Whether the filter panel is open */
  isOpen: boolean
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void
  /** Current category being filtered */
  category?: ContentCategory | 'all'
  /** Custom class name */
  className?: string
}

/**
 * Content filters component for category pages
 */
export function ContentFilters({
  isOpen,
  onFiltersChange,
  category = 'all',
  className = '',
}: ContentFiltersProps) {
  const { searchFilters, setSearchFilters, resetSearch } = useUIStore()
  const [localFilters, setLocalFilters] = useState<SearchFilters>(searchFilters)

  // Genre options by category
  const genreOptions: Record<ContentCategory | 'all', string[]> = {
    all: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'],
    movie: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'],
    tv: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Mystery', 'Reality', 'Romance', 'Sci-Fi', 'Thriller', 'Talk'],
    book: ['Biography', 'Business', 'Children', 'Classic', 'Contemporary', 'Fantasy', 'Fiction', 'History', 'Horror', 'Mystery', 'Non-Fiction', 'Poetry', 'Romance', 'Sci-Fi', 'Self-Help', 'Thriller', 'Young Adult'],
    game: ['Action', 'Adventure', 'Arcade', 'Fighting', 'FPS', 'Horror', 'Indie', 'MMO', 'Platform', 'Puzzle', 'Racing', 'RPG', 'Simulation', 'Sports', 'Strategy', 'Survival'],
  }

  const currentYear = new Date().getFullYear()
  const availableGenres = genreOptions[category] || genreOptions.all

  useEffect(() => {
    setLocalFilters(searchFilters)
  }, [searchFilters])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    setSearchFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleGenreToggle = (genre: string) => {
    const currentGenres = localFilters.genres || []
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre]
    
    handleFilterChange('genres', newGenres)
  }

  const handleReset = () => {
    resetSearch()
    onFiltersChange({})
  }

  const hasActiveFilters = localFilters.genres?.length || 
    (localFilters.yearRange && (localFilters.yearRange[0] !== 1900 || localFilters.yearRange[1] !== currentYear)) ||
    (localFilters.ratingRange && (localFilters.ratingRange[0] !== 0 || localFilters.ratingRange[1] !== 5))

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden ${className}`}
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Clear all
                </motion.button>
              )}
            </div>

            {/* Genres */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <span>Genres</span>
                {localFilters.genres?.length && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                    {localFilters.genres.length}
                  </span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map(genre => (
                  <motion.button
                    key={genre}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                      localFilters.genres?.includes(genre)
                        ? 'bg-primary-600 text-white border-primary-600 dark:bg-primary-500 dark:border-primary-500'
                        : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    {genre}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Year Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Release Year
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      From
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={currentYear}
                      value={localFilters.yearRange?.[0] || 1900}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value)
                        const currentRange = localFilters.yearRange || [1900, currentYear]
                        handleFilterChange('yearRange', [newValue, currentRange[1]])
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      To
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max={currentYear}
                      value={localFilters.yearRange?.[1] || currentYear}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value)
                        const currentRange = localFilters.yearRange || [1900, currentYear]
                        handleFilterChange('yearRange', [currentRange[0], newValue])
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <StarIcon className="w-4 h-4 mr-2" />
                Minimum Rating
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={localFilters.ratingRange?.[0] || 0}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value)
                        const currentRange = localFilters.ratingRange || [0, 5]
                        handleFilterChange('ratingRange', [newValue, currentRange[1]])
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>0</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {localFilters.ratingRange?.[0] || 0}+ stars
                      </span>
                      <span>5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Language Filter (for international content) */}
            {(category === 'movie' || category === 'tv' || category === 'book') && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Language
                </h4>
                <select
                  value={localFilters.language || ''}
                  onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}