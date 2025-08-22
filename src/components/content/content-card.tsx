'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { StarIcon, HeartIcon, BookmarkIcon, PlayIcon } from 'lucide-react'
import { Content, ContentCategory } from '@/types/content'
import { cardHover, moviePosterHover } from '@/lib/animations'

interface ContentCardProps {
  content: Content
  showCategory?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'poster' | 'landscape'
}

export function ContentCard({ 
  content, 
  showCategory = true, 
  size = 'md',
  variant = 'poster' 
}: ContentCardProps) {
  const getCategoryIcon = (category: ContentCategory) => {
    switch (category) {
      case 'movie':
        return <PlayIcon className="w-4 h-4" />
      case 'tv':
        return <PlayIcon className="w-4 h-4" />
      case 'book':
        return <BookmarkIcon className="w-4 h-4" />
      case 'game':
        return <StarIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const getCategoryColor = (category: ContentCategory) => {
    switch (category) {
      case 'movie':
        return 'bg-red-500'
      case 'tv':
        return 'bg-blue-500'
      case 'book':
        return 'bg-green-500'
      case 'game':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear()
  }

  const sizeClasses = {
    sm: variant === 'poster' ? 'w-32 h-48' : 'w-48 h-32',
    md: variant === 'poster' ? 'w-48 h-72' : 'w-72 h-48',
    lg: variant === 'poster' ? 'w-64 h-96' : 'w-96 h-64',
  }

  const titleClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="pressed"
      className="group cursor-pointer"
    >
      <Link href={`/${content.category}/${content.id}`}>
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-dark-800 shadow-lg hover:shadow-cinema transition-all duration-300">
          {/* Image Container */}
          <motion.div 
            variants={moviePosterHover}
            className={`relative ${sizeClasses[size]} overflow-hidden`}
          >
            <Image
              src={content.imageUrl}
              alt={content.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes={`(max-width: 768px) 100vw, ${size === 'sm' ? '200px' : size === 'md' ? '300px' : '400px'}`}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Category Badge */}
            {showCategory && (
              <div className={`absolute top-3 left-3 ${getCategoryColor(content.category)} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                {getCategoryIcon(content.category)}
                {content.category.toUpperCase()}
              </div>
            )}
            
            {/* Rating Badge */}
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <StarIcon className="w-3 h-3 fill-cinema-gold text-cinema-gold" />
              4.2
            </div>
            
            {/* Quick Actions (visible on hover) */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors touch-target"
                onClick={(e) => {
                  e.preventDefault()
                  // TODO: Add to favorites
                }}
              >
                <HeartIcon className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors touch-target"
                onClick={(e) => {
                  e.preventDefault()
                  // TODO: Add to list
                }}
              >
                <BookmarkIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
          
          {/* Content Info */}
          <div className="p-4">
            <h3 className={`font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 ${titleClasses[size]}`}>
              {content.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatDate(content.releaseDate)}</span>
              <div className="flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current text-cinema-gold" />
                <span className="font-medium">4.2</span>
                <span className="text-xs">(234)</span>
              </div>
            </div>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-1 mt-2">
              {content.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                >
                  {genre}
                </span>
              ))}
              {content.genres.length > 2 && (
                <span className="text-xs bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                  +{content.genres.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}