/**
 * API service utilities for backend integration
 * All endpoints are prepared for your backend implementation
 */

import { Content, ContentCategory, SearchFilters, SearchResult, ContentRating, ContentList } from '@/types/content'
import { User } from '@/stores/auth-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic API request handler with authentication
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken')
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new ApiError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error.code
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error', 0)
  }
}

/**
 * Authentication API calls
 */
export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(userData: {
    name: string
    email: string
    username: string
    password: string
  }): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async logout(): Promise<ApiResponse<null>> {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile')
  },

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },
}

/**
 * Content API calls
 */
export const contentApi = {
  async getContent(category: ContentCategory, filters?: SearchFilters): Promise<PaginatedResponse<Content>> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }
    
    const query = params.toString()
    return apiRequest(`/content/${category}${query ? `?${query}` : ''}`)
  },

  async getContentById(id: string): Promise<ApiResponse<Content>> {
    return apiRequest(`/content/${id}`)
  },

  async searchContent(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }
    
    return apiRequest(`/content/search?${params.toString()}`)
  },

  async getFeaturedContent(): Promise<ApiResponse<Content[]>> {
    return apiRequest('/content/featured')
  },

  async getTrendingContent(): Promise<ApiResponse<Content[]>> {
    return apiRequest('/content/trending')
  },
}

/**
 * Ratings API calls
 */
export const ratingsApi = {
  async rateContent(contentId: string, rating: number, review?: string): Promise<ApiResponse<ContentRating>> {
    return apiRequest('/ratings', {
      method: 'POST',
      body: JSON.stringify({ contentId, rating, review }),
    })
  },

  async updateRating(ratingId: string, rating: number, review?: string): Promise<ApiResponse<ContentRating>> {
    return apiRequest(`/ratings/${ratingId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, review }),
    })
  },

  async deleteRating(ratingId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/ratings/${ratingId}`, {
      method: 'DELETE',
    })
  },

  async getUserRatings(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<ContentRating>> {
    return apiRequest(`/users/${userId}/ratings?page=${page}&limit=${limit}`)
  },

  async getContentRatings(contentId: string, page = 1, limit = 20): Promise<PaginatedResponse<ContentRating>> {
    return apiRequest(`/content/${contentId}/ratings?page=${page}&limit=${limit}`)
  },
}

/**
 * Lists API calls
 */
export const listsApi = {
  async createList(name: string, description?: string, isPublic = true): Promise<ApiResponse<ContentList>> {
    return apiRequest('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description, isPublic }),
    })
  },

  async getLists(userId?: string, page = 1, limit = 20): Promise<PaginatedResponse<ContentList>> {
    const endpoint = userId ? `/users/${userId}/lists` : '/lists'
    return apiRequest(`${endpoint}?page=${page}&limit=${limit}`)
  },

  async getListById(listId: string): Promise<ApiResponse<ContentList>> {
    return apiRequest(`/lists/${listId}`)
  },

  async updateList(listId: string, updates: Partial<ContentList>): Promise<ApiResponse<ContentList>> {
    return apiRequest(`/lists/${listId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  async deleteList(listId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/lists/${listId}`, {
      method: 'DELETE',
    })
  },

  async addToList(listId: string, contentId: string, note?: string): Promise<ApiResponse<ContentList>> {
    return apiRequest(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({ contentId, note }),
    })
  },

  async removeFromList(listId: string, contentId: string): Promise<ApiResponse<ContentList>> {
    return apiRequest(`/lists/${listId}/items/${contentId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * Social/Community API calls
 */
export const socialApi = {
  async followUser(userId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/users/${userId}/follow`, {
      method: 'POST',
    })
  },

  async unfollowUser(userId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/users/${userId}/follow`, {
      method: 'DELETE',
    })
  },

  async getFollowers(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    return apiRequest(`/users/${userId}/followers?page=${page}&limit=${limit}`)
  },

  async getFollowing(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    return apiRequest(`/users/${userId}/following?page=${page}&limit=${limit}`)
  },

  async getActivityFeed(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return apiRequest(`/social/feed?page=${page}&limit=${limit}`)
  },

  async likeRating(ratingId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/ratings/${ratingId}/like`, {
      method: 'POST',
    })
  },

  async unlikeRating(ratingId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/ratings/${ratingId}/like`, {
      method: 'DELETE',
    })
  },
}

export { ApiError }