export type ContentCategory = 'movie' | 'book' | 'game' | 'tv'

export interface BaseContent {
  id: string
  title: string
  originalTitle?: string
  description: string
  imageUrl: string
  backdropUrl?: string
  releaseDate: string
  genres: string[]
  category: ContentCategory
  externalIds: {
    imdb?: string
    tmdb?: string
    igdb?: string
    goodreads?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Movie extends BaseContent {
  category: 'movie'
  director: string[]
  cast: string[]
  runtime: number
  budget?: number
  revenue?: number
  language: string
  countries: string[]
  certification?: string
}

export interface TVShow extends BaseContent {
  category: 'tv'
  creators: string[]
  cast: string[]
  seasons: number
  episodes: number
  status: 'ended' | 'ongoing' | 'cancelled'
  network: string
  language: string
  countries: string[]
}

export interface Book extends BaseContent {
  category: 'book'
  authors: string[]
  publisher: string
  pages: number
  isbn?: string
  language: string
  series?: string
  seriesOrder?: number
}

export interface Game extends BaseContent {
  category: 'game'
  developers: string[]
  publishers: string[]
  platforms: string[]
  engine?: string
  modes: ('single-player' | 'multiplayer' | 'co-op')[]
  esrbRating?: string
}

export type Content = Movie | TVShow | Book | Game

export interface ContentRating {
  id: string
  userId: string
  contentId: string
  rating: number // 0-5 with 0.5 increments
  review?: string
  createdAt: string
  updatedAt: string
  likes: number
  isLiked?: boolean
  isSpoiler: boolean
}

export interface ContentList {
  id: string
  name: string
  description?: string
  userId: string
  isPublic: boolean
  items: {
    contentId: string
    addedAt: string
    note?: string
  }[]
  followers: number
  isFollowing?: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentStats {
  contentId: string
  averageRating: number
  totalRatings: number
  ratingDistribution: {
    '0.5': number
    '1': number
    '1.5': number
    '2': number
    '2.5': number
    '3': number
    '3.5': number
    '4': number
    '4.5': number
    '5': number
  }
  totalReviews: number
  totalLists: number
  popularity: number
}

export interface SearchFilters {
  category?: ContentCategory | 'all'
  genres?: string[]
  yearRange?: [number, number]
  ratingRange?: [number, number]
  language?: string
  sortBy?: 'title' | 'rating' | 'release_date' | 'popularity' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult {
  content: Content[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}