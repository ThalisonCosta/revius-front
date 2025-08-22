export interface UserProfile {
  id: string
  email: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  banner?: string
  location?: string
  website?: string
  birthDate?: string
  joinedAt: string
  isVerified: boolean
  isPrivate: boolean
  preferences: UserPreferences
  stats: UserStats
  socialLinks?: {
    twitter?: string
    instagram?: string
    letterboxd?: string
    goodreads?: string
    steam?: string
  }
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    newFollowers: boolean
    newRatings: boolean
    newComments: boolean
    newLists: boolean
    recommendations: boolean
    weeklyDigest: boolean
  }
  privacy: {
    profileVisible: boolean
    ratingsVisible: boolean
    listsVisible: boolean
    followersVisible: boolean
    activityVisible: boolean
  }
  content: {
    adultContent: boolean
    spoilerWarnings: boolean
    autoplay: boolean
    dataUsage: 'low' | 'medium' | 'high'
  }
}

export interface UserStats {
  totalRatings: number
  totalReviews: number
  totalLists: number
  publicLists: number
  followers: number
  following: number
  averageRating: number
  favoriteGenres: string[]
  categoryBreakdown: {
    movies: number
    tv: number
    books: number
    games: number
  }
  yearActivity: {
    [year: string]: number
  }
  streaks: {
    current: number
    longest: number
    lastActivity: string
  }
}

export interface UserFollow {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

export interface UserActivity {
  id: string
  userId: string
  type: 'rating' | 'review' | 'list' | 'follow' | 'like'
  contentId?: string
  targetUserId?: string
  listId?: string
  data: Record<string, any>
  createdAt: string
}

export interface UserSession {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  deviceInfo: {
    userAgent: string
    ip: string
    country?: string
    city?: string
  }
  isActive: boolean
  createdAt: string
  lastUsedAt: string
}