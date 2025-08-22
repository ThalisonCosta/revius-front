'use client'

import { motion } from 'framer-motion'
import { ContentCard } from '@/components/content/content-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'
import { Content } from '@/types/content'

// Mock data - this would come from API in real implementation
const mockFeaturedContent: Content[] = [
  {
    id: '1',
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    description: 'A computer programmer discovers reality as he knows it is a simulation.',
    imageUrl: 'https://images.unsplash.com/photo-1489599256329-4e1d0930e76e?w=400&h=600&fit=crop',
    releaseDate: '1999-03-31',
    genres: ['Action', 'Sci-Fi'],
    category: 'movie',
    externalIds: { imdb: 'tt0133093' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    director: ['Lana Wachowski', 'Lilly Wachowski'],
    cast: ['Keanu Reeves', 'Laurence Fishburne'],
    runtime: 136,
    language: 'English',
    countries: ['USA'],
  },
  {
    id: '2',
    title: 'Dune',
    originalTitle: 'Dune',
    description: 'A mythic and emotionally charged hero\'s journey.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    releaseDate: '1965-01-01',
    genres: ['Science Fiction', 'Adventure'],
    category: 'book',
    externalIds: { goodreads: '234225' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    authors: ['Frank Herbert'],
    publisher: 'Ace Books',
    pages: 688,
    language: 'English',
  },
  {
    id: '3',
    title: 'The Witcher 3: Wild Hunt',
    description: 'A story-driven open world RPG set in a visually stunning fantasy universe.',
    imageUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop',
    releaseDate: '2015-05-19',
    genres: ['RPG', 'Action'],
    category: 'game',
    externalIds: { igdb: '1942' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    developers: ['CD Projekt Red'],
    publishers: ['CD Projekt'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    modes: ['single-player'],
  },
  {
    id: '4',
    title: 'Breaking Bad',
    description: 'A high school chemistry teacher turned methamphetamine producer.',
    imageUrl: 'https://images.unsplash.com/photo-1489599256329-4e1d0930e76e?w=400&h=600&fit=crop',
    releaseDate: '2008-01-20',
    genres: ['Drama', 'Crime'],
    category: 'tv',
    externalIds: { imdb: 'tt0903747' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    creators: ['Vince Gilligan'],
    cast: ['Bryan Cranston', 'Aaron Paul'],
    seasons: 5,
    episodes: 62,
    status: 'ended',
    network: 'AMC',
    language: 'English',
    countries: ['USA'],
  },
]

export function FeaturedContent() {
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
            Featured Content
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover the most popular and highly-rated content across all categories
          </p>
        </motion.div>

        <StaggerContainer className="content-grid">
          {mockFeaturedContent.map((content, index) => (
            <StaggerItem key={content.id} index={index}>
              <ContentCard content={content} size="md" />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-8 py-3"
          >
            View All Featured
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}