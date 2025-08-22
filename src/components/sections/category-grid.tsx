import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PlayIcon, BookOpenIcon, GamepadIcon, TvIcon } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container'

const categories = [
  {
    id: 'movies',
    name: 'Movies',
    description: 'Discover and rate your favorite films',
    icon: PlayIcon,
    gradient: 'from-red-500 to-pink-600',
    count: '25,000+',
    href: '/movies',
  },
  {
    id: 'tv',
    name: 'TV Shows',
    description: 'Binge-worthy series and episodes',
    icon: TvIcon,
    gradient: 'from-blue-500 to-cyan-600',
    count: '15,000+',
    href: '/tv',
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Literary masterpieces and bestsellers',
    icon: BookOpenIcon,
    gradient: 'from-green-500 to-emerald-600',
    count: '50,000+',
    href: '/books',
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Epic adventures and indie gems',
    icon: GamepadIcon,
    gradient: 'from-purple-500 to-violet-600',
    count: '30,000+',
    href: '/games',
  },
]

export function CategoryGrid() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-dark-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Explore Categories
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Dive into our vast collection of entertainment content across all your favorite categories
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <StaggerItem key={category.id} index={index}>
              <Link to={category.href}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-700 shadow-lg hover:shadow-cinema transition-all duration-300 group cursor-pointer"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${category.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="w-8 h-8" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {category.description}
                    </p>
                    
                    {/* Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {category.count} items
                      </span>
                      <motion.div
                        className="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform duration-300"
                        initial={false}
                      >
                        →
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-500/30 rounded-2xl transition-colors duration-300" />
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}