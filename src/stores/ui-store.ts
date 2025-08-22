import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  // Navigation
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  
  // Modals
  isLoginModalOpen: boolean
  isSignupModalOpen: boolean
  isRatingModalOpen: boolean
  isShareModalOpen: boolean
  
  // Player/Media
  isPlayerOpen: boolean
  currentMediaId: string | null
  playerVolume: number
  isPlayerMuted: boolean
  
  // UI Preferences
  viewMode: 'grid' | 'list'
  sortBy: 'title' | 'rating' | 'date' | 'popularity'
  sortOrder: 'asc' | 'desc'
  
  // Search
  searchQuery: string
  searchFilters: {
    category: 'all' | 'movies' | 'books' | 'games' | 'tv'
    genre: string[]
    year: [number, number]
    rating: [number, number]
  }
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  setLoginModalOpen: (open: boolean) => void
  setSignupModalOpen: (open: boolean) => void
  setRatingModalOpen: (open: boolean) => void
  setShareModalOpen: (open: boolean) => void
  setPlayerOpen: (open: boolean) => void
  setCurrentMediaId: (id: string | null) => void
  setPlayerVolume: (volume: number) => void
  setPlayerMuted: (muted: boolean) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSortBy: (sortBy: 'title' | 'rating' | 'date' | 'popularity') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  setSearchQuery: (query: string) => void
  setSearchFilters: (filters: Partial<UIState['searchFilters']>) => void
  setLoading: (loading: boolean, message?: string) => void
  resetSearch: () => void
  closeAllModals: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isSidebarOpen: false,
        isMobileMenuOpen: false,
        isLoginModalOpen: false,
        isSignupModalOpen: false,
        isRatingModalOpen: false,
        isShareModalOpen: false,
        isPlayerOpen: false,
        currentMediaId: null,
        playerVolume: 80,
        isPlayerMuted: false,
        viewMode: 'grid',
        sortBy: 'popularity',
        sortOrder: 'desc',
        searchQuery: '',
        searchFilters: {
          category: 'all',
          genre: [],
          year: [1900, new Date().getFullYear()],
          rating: [0, 5],
        },
        isLoading: false,
        loadingMessage: '',
        
        // Actions
        setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
        setMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),
        setLoginModalOpen: (open: boolean) => set({ isLoginModalOpen: open }),
        setSignupModalOpen: (open: boolean) => set({ isSignupModalOpen: open }),
        setRatingModalOpen: (open: boolean) => set({ isRatingModalOpen: open }),
        setShareModalOpen: (open: boolean) => set({ isShareModalOpen: open }),
        setPlayerOpen: (open: boolean) => set({ isPlayerOpen: open }),
        setCurrentMediaId: (id: string | null) => set({ currentMediaId: id }),
        setPlayerVolume: (volume: number) => set({ playerVolume: volume }),
        setPlayerMuted: (muted: boolean) => set({ isPlayerMuted: muted }),
        setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
        setSortBy: (sortBy: 'title' | 'rating' | 'date' | 'popularity') => set({ sortBy }),
        setSortOrder: (order: 'asc' | 'desc') => set({ sortOrder: order }),
        setSearchQuery: (query: string) => set({ searchQuery: query }),
        setSearchFilters: (filters: Partial<UIState['searchFilters']>) =>
          set((state) => ({
            searchFilters: { ...state.searchFilters, ...filters },
          })),
        setLoading: (loading: boolean, message = '') =>
          set({ isLoading: loading, loadingMessage: message }),
        resetSearch: () =>
          set({
            searchQuery: '',
            searchFilters: {
              category: 'all',
              genre: [],
              year: [1900, new Date().getFullYear()],
              rating: [0, 5],
            },
          }),
        closeAllModals: () =>
          set({
            isLoginModalOpen: false,
            isSignupModalOpen: false,
            isRatingModalOpen: false,
            isShareModalOpen: false,
          }),
      }),
      {
        name: 'revius-ui-store',
        partialize: (state) => ({
          // Only persist these values
          playerVolume: state.playerVolume,
          isPlayerMuted: state.isPlayerMuted,
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
)