import { Metadata } from 'next'
import { Hero } from '@/components/sections/hero'
import { FeaturedContent } from '@/components/sections/featured-content'
import { CategoryGrid } from '@/components/sections/category-grid'
import { CommunityHighlights } from '@/components/sections/community-highlights'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover, rate, and share your favorite movies, books, games, and TV shows on Revius.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeaturedContent />
      <CategoryGrid />
      <CommunityHighlights />
    </main>
  )
}