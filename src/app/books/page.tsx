'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, FilterIcon } from 'lucide-react'
import { ContentGrid } from '@/components/content/content-grid'
import { ContentFilters } from '@/components/content/content-filters'
import { Pagination } from '@/components/ui/pagination'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { Book, SearchFilters } from '@/types/content'
import { contentApi, ApiError } from '@/lib/api'
import { fadeInUp, staggerContainer } from '@/lib/animations'

interface BooksPageState {
  books: Book[]
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
const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Fellowship of the Ring',
    originalTitle: 'The Lord of the Rings: The Fellowship of the Ring',
    description: 'One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them. In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, The Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others.',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/0547928211.01.HZZZZZZZ.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3',
    releaseDate: '1954-07-29',
    genres: ['Fantasy', 'Adventure', 'Fiction'],
    category: 'book',
    authors: ['J.R.R. Tolkien'],
    publisher: 'George Allen & Unwin',
    pages: 423,
    isbn: '9780547928210',
    language: 'en',
    series: 'The Lord of the Rings',
    seriesOrder: 1,
    externalIds: {
      goodreads: '3263607',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    originalTitle: 'To Kill a Mockingbird',
    description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. "To Kill A Mockingbird" became both an instant bestseller and a critical success when it was first published in 1960.',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/0060935464.01.HZZZZZZZ.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3',
    releaseDate: '1960-07-11',
    genres: ['Classic', 'Fiction', 'Drama'],
    category: 'book',
    authors: ['Harper Lee'],
    publisher: 'J. B. Lippincott & Co.',
    pages: 376,
    isbn: '9780060935467',
    language: 'en',
    externalIds: {
      goodreads: '2657',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'The Great Gatsby',
    originalTitle: 'The Great Gatsby',
    description: 'The Great Gatsby, F. Scott Fitzgerald\'s third book, stands as the supreme achievement of his career. This exemplary novel of the Jazz Age has been acclaimed by generations of readers.',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/0743273567.01.HZZZZZZZ.jpg',
    backdropUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3',
    releaseDate: '1925-04-10',
    genres: ['Classic', 'Fiction', 'Drama'],
    category: 'book',
    authors: ['F. Scott Fitzgerald'],
    publisher: 'Charles Scribner\'s Sons',
    pages: 180,
    isbn: '9780743273565',
    language: 'en',
    externalIds: {
      goodreads: '4671',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

function BooksPageContent() {
  const [state, setState] = useState<BooksPageState>({
    books: [],
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
    category: 'book',
    page: 1,
    limit: ITEMS_PER_PAGE,
    sortBy: 'popularity',
    sortOrder: 'desc',
  })

  const loadBooks = async (newFilters: SearchFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await contentApi.getContent('book', newFilters)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock response for development
      const mockResponse = {
        data: mockBooks,
        pagination: {
          page: newFilters.page || 1,
          limit: newFilters.limit || ITEMS_PER_PAGE,
          total: mockBooks.length,
          totalPages: Math.ceil(mockBooks.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasNext: (newFilters.page || 1) < Math.ceil(mockBooks.length / (newFilters.limit || ITEMS_PER_PAGE)),
          hasPrev: (newFilters.page || 1) > 1,
        },
      }
      
      setState(prev => ({
        ...prev,
        books: mockResponse.data as Book[],
        currentPage: mockResponse.pagination.page,
        totalPages: mockResponse.pagination.totalPages,
        hasNext: mockResponse.pagination.hasNext,
        hasPrev: mockResponse.pagination.hasPrev,
        totalResults: mockResponse.pagination.total,
        isLoading: false,
      }))
    } catch (error) {
      let errorMessage = 'Failed to load books'
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
    loadBooks(filters)
  }, [])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
      category: 'book' as const,
    }
    setFilters(updatedFilters)
    loadBooks(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    loadBooks(updatedFilters)
    
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRetry = () => {
    loadBooks(filters)
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
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                  <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Books
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover and rate books across all genres
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {state.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Books
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  47
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Genres
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  4.1★
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  89K
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Authors
                </div>
              </div>
            </motion.div>

            {/* Popular Genres */}
            <motion.div variants={fadeInUp} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Fiction', 'Fantasy', 'Mystery', 'Romance', 'Sci-Fi', 'Biography', 'History', 'Self-Help'].map(genre => (
                  <motion.button
                    key={genre}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >
                    {genre}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Filter Toggle */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Browse Books
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
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
                category="book"
                className="mb-6"
              />
            </motion.div>
          </motion.div>

          {/* Books Grid */}
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
                content={state.books}
                isLoading={state.isLoading}
                category="book"
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

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading books...</div>
      </div>
    </div>}>
      <BooksPageContent />
    </Suspense>
  )
}