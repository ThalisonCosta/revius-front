'use client'

import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNext?: boolean
  /** Whether there is a previous page */
  hasPrev?: boolean
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Show page numbers around current page */
  siblingCount?: number
  /** Custom class name */
  className?: string
}

/**
 * Pagination component with page numbers and navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  siblingCount = 1,
  className = '',
}: PaginationProps) {
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const delta = siblingCount
    const range = []
    const rangeWithDots = []

    // Always show first page
    range.push(1)

    // Calculate range around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      range.push(totalPages)
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b)

    // Add dots where there are gaps
    let l = 0
    for (const i of uniqueRange) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  if (totalPages <= 1) {
    return null
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      className={`flex items-center justify-center space-x-1 ${className}`}
      aria-label="Pagination"
    >
      {/* Previous button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev && currentPage <= 1}
        className="flex items-center justify-center w-10 h-10 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-800 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </motion.button>

      {/* Page numbers */}
      {pageNumbers.map((pageNumber, index) => {
        if (pageNumber === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
            </span>
          )
        }

        const isCurrentPage = pageNumber === currentPage
        
        return (
          <motion.button
            key={pageNumber}
            whileHover={{ scale: isCurrentPage ? 1 : 1.05 }}
            whileTap={{ scale: isCurrentPage ? 1 : 0.95 }}
            onClick={() => onPageChange(pageNumber as number)}
            disabled={isCurrentPage}
            className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
              isCurrentPage
                ? 'bg-primary-600 text-white shadow-sm cursor-default'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {pageNumber}
          </motion.button>
        )
      })}

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext && currentPage >= totalPages}
        className="flex items-center justify-center w-10 h-10 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-800 disabled:hover:text-gray-500 dark:disabled:hover:text-gray-400 transition-colors"
        aria-label="Next page"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </motion.button>
    </nav>
  )
}

interface SimplePaginationProps {
  /** Whether there is a next page */
  hasNext: boolean
  /** Whether there is a previous page */
  hasPrev: boolean
  /** Current page number for display */
  currentPage: number
  /** Total pages for display */
  totalPages?: number
  /** Callback for previous page */
  onPrevious: () => void
  /** Callback for next page */
  onNext: () => void
  /** Custom class name */
  className?: string
}

/**
 * Simple pagination with just previous/next buttons
 */
export function SimplePagination({
  hasNext,
  hasPrev,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = '',
}: SimplePaginationProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPrevious}
        disabled={!hasPrev}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-2" />
        Previous
      </motion.button>

      {totalPages && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        disabled={!hasNext}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRightIcon className="w-4 h-4 ml-2" />
      </motion.button>
    </div>
  )
}