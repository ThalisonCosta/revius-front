'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { MessageSquareIcon, HeartIcon, TrendingUpIcon, UsersIcon } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'

const communityStats = [
  {
    icon: UsersIcon,
    label: 'Active Users',
    value: '50,000+',
    change: '+12%',
    color: 'text-blue-500',
  },
  {
    icon: MessageSquareIcon,
    label: 'Reviews Today',
    value: '1,234',
    change: '+23%',
    color: 'text-green-500',
  },
  {
    icon: HeartIcon,
    label: 'Ratings This Week',
    value: '45,678',
    change: '+8%',
    color: 'text-red-500',
  },
  {
    icon: TrendingUpIcon,
    label: 'Trending Discussions',
    value: '892',
    change: '+45%',
    color: 'text-purple-500',
  },
]

const featuredReviews = [
  {
    id: '1',
    user: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      username: '@alexchen',
    },
    content: {
      title: 'The Batman',
      category: 'movie',
    },
    review: 'An absolutely stunning take on the Dark Knight. The cinematography is breathtaking and Pattinson delivers a phenomenal performance.',
    rating: 4.5,
    likes: 234,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    user: {
      name: 'Sarah Kim',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b0e1?w=100&h=100&fit=crop&crop=face',
      username: '@sarahkim',
    },
    content: {
      title: 'Project Hail Mary',
      category: 'book',
    },
    review: 'Andy Weir has done it again! This book had me laughing, crying, and on the edge of my seat. The science is fascinating and the story is incredibly moving.',
    rating: 5.0,
    likes: 456,
    timestamp: '4 hours ago',
  },
]

export function CommunityHighlights() {
  return (
    <section className="py-16 bg-white dark:bg-dark-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Highlights
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what our community is discovering, discussing, and loving right now
          </p>
        </motion.div>

        {/* Community Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {communityStats.map((stat, index) => (
            <StaggerItem key={stat.label} index={index}>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6 text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.color} bg-opacity-10 mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-green-500 font-medium">
                  {stat.change} this week
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Featured Reviews */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {featuredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={review.user.avatar}
                  alt={review.user.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {review.user.name}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {review.user.username}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Reviewed {review.content.title} • {review.timestamp}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <div
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-cinema-gold fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        ⭐
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                {review.review}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  <HeartIcon className="w-4 h-4" />
                  {review.likes}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Read full review
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-8 py-3 mr-4"
          >
            Join the Community
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary px-8 py-3"
          >
            Browse Reviews
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}