'use client'

import { motion } from 'framer-motion'
import { SearchIcon, TrendingUpIcon, UsersIcon, StarIcon } from 'lucide-react'
import { AnimatedWrapper } from '@/components/ui/animated-wrapper'
import { fadeInUp, fadeInDown, staggerContainer, staggerItem } from '@/lib/animations'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,117,63,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(242,117,63,0.1)_50%,transparent_75%)]" />
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main Hero Content */}
          <AnimatedWrapper variants={fadeInDown} className="mb-8">
            <h1 className="cinema-text text-6xl md:text-8xl font-display font-bold mb-6 leading-none">
              <span className="text-accent-500">Rate Everything</span>
            </h1>
          </AnimatedWrapper>
          
          <AnimatedWrapper variants={fadeInUp} delay={0.2} className="mb-12">
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover, rate, and share your favorite movies, books, games, and TV shows. 
              Join a community of entertainment enthusiasts who share your passion.
            </p>
          </AnimatedWrapper>
          
          {/* CTA Buttons */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.button 
              variants={staggerItem}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4 rounded-xl font-semibold shadow-cinema"
            >
              Start Rating
            </motion.button>
            <motion.button 
              variants={staggerItem}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-lg px-8 py-4 rounded-xl font-semibold border-2 border-white/20 hover:border-white/40"
            >
              Explore Content
            </motion.button>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-16"
          >
            <motion.div variants={staggerItem} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <StarIcon className="w-6 h-6 text-cinema-gold" />
              </div>
              <div className="text-2xl font-bold text-white">1M+</div>
              <div className="text-sm text-gray-400">Ratings</div>
            </motion.div>
            
            <motion.div variants={staggerItem} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <UsersIcon className="w-6 h-6 text-cinema-gold" />
              </div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-gray-400">Users</div>
            </motion.div>
            
            <motion.div variants={staggerItem} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUpIcon className="w-6 h-6 text-cinema-gold" />
              </div>
              <div className="text-2xl font-bold text-white">100K+</div>
              <div className="text-sm text-gray-400">Content</div>
            </motion.div>
            
            <motion.div variants={staggerItem} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <SearchIcon className="w-6 h-6 text-cinema-gold" />
              </div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-gray-400">Discovery</div>
            </motion.div>
          </motion.div>
          
          {/* Search Bar */}
          <AnimatedWrapper variants={fadeInUp} delay={0.8}>
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search movies, books, games, TV shows..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt blur"></div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>
    </section>
  )
}