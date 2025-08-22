import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  username: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  createdAt: string
  isVerified: boolean
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: {
      email: boolean
      push: boolean
      newFollowers: boolean
      newRatings: boolean
      recommendations: boolean
    }
    privacy: {
      profileVisible: boolean
      ratingsVisible: boolean
      listsVisible: boolean
    }
  }
  stats: {
    totalRatings: number
    totalReviews: number
    totalLists: number
    followers: number
    following: number
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setTokens: (token: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  updatePreferences: (preferences: Partial<User['preferences']>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        refreshToken: null,
        
        setUser: (user: User | null) => 
          set({ 
            user, 
            isAuthenticated: !!user 
          }),
        
        setTokens: (token: string, refreshToken: string) =>
          set({ token, refreshToken }),
        
        login: async (email: string, password: string) => {
          set({ isLoading: true })
          try {
            // TODO: Implement actual login API call
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })
            
            if (!response.ok) {
              throw new Error('Login failed')
            }
            
            const data = await response.json()
            
            set({
              user: data.user,
              token: data.token,
              refreshToken: data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },
        
        logout: () => {
          // TODO: Call logout API endpoint to invalidate tokens
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        },
        
        updateUser: (updates: Partial<User>) => {
          const { user } = get()
          if (user) {
            set({ user: { ...user, ...updates } })
          }
        },
        
        updatePreferences: (preferences: Partial<User['preferences']>) => {
          const { user } = get()
          if (user) {
            set({
              user: {
                ...user,
                preferences: { ...user.preferences, ...preferences },
              },
            })
          }
        },
        
        clearAuth: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        },
      }),
      {
        name: 'revius-auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)