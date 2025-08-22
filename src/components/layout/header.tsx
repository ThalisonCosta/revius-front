'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { 
  SearchIcon, 
  MenuIcon, 
  XIcon, 
  SunIcon, 
  MoonIcon, 
  UserIcon,
  LogInIcon,
  UserPlusIcon
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'

const navigation = [
  { name: 'Movies', href: '/movies' },
  { name: 'TV Shows', href: '/tv' },
  { name: 'Books', href: '/books' },
  { name: 'Games', href: '/games' },
  { name: 'Lists', href: '/lists' },
  { name: 'Community', href: '/community' },
]

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isMobileMenuOpen, setMobileMenuOpen, setLoginModalOpen, setSignupModalOpen } = useUIStore()
  const { isAuthenticated, user } = useAuthStore()

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen)
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-700"
      >
        {/* Use container to match hero sections */}
        <nav className="container mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
              >
                Revius
              </motion.div>
            </Link>

            {/* Right side content - Navigation and Actions aligned with hero content */}
            <div className="flex items-center justify-end flex-1">
              <div className="flex items-center justify-end w-full mx-auto" style={{maxWidth: 'calc(56rem - 100px)'}}>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8 mr-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

              </div>
                {/* Actions */}
                <div className="flex items-center space-x-3 flex-shrink-0">

                  {/* Theme Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-target"
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="w-5 h-5" />
                    ) : (
                      <MoonIcon className="w-5 h-5" />
                    )}
                  </motion.button>

                  {/* Auth Buttons / User Menu */}
                  {isAuthenticated && user ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span className="hidden sm:block font-medium">{user.name}</span>
                    </motion.button>
                  ) : (
                    <div className="hidden sm:flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLoginModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                      >
                        <LogInIcon className="w-4 h-4" />
                        <span>Login</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSignupModalOpen(true)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Sign Up
                      </motion.button>
                    </div>
                  )}
                </div>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-target ml-auto"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </nav>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-dark-700 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="relative max-w-2xl mx-auto">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search movies, books, games, TV shows..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 z-50 w-80 h-full bg-white dark:bg-dark-900 shadow-2xl md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
                  <span className="text-lg font-display font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors touch-target"
                  >
                    <XIcon className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors font-medium"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Auth Buttons */}
                {!isAuthenticated && (
                  <div className="p-4 border-t border-gray-200 dark:border-dark-700 space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLoginModalOpen(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border border-gray-300 dark:border-dark-600 rounded-lg transition-colors font-medium"
                    >
                      <LogInIcon className="w-4 h-4" />
                      <span>Login</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSignupModalOpen(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full btn-primary py-3"
                    >
                      Sign Up
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}