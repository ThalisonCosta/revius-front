import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://revius.com.br'),
  title: {
    template: '%s | Revius',
    default: 'Revius - Rate Movies, Books, Games & TV Shows',
  },
  description: 'Discover, rate, and share your favorite entertainment content. Join the community of movie, book, game, and TV enthusiasts on Revius.',
  keywords: ['movies', 'books', 'games', 'tv shows', 'ratings', 'reviews', 'entertainment'],
  authors: [{ name: 'Revius Team' }],
  creator: 'Revius',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://revius.com.br',
    siteName: 'Revius',
    title: 'Revius - Rate Movies, Books, Games & TV Shows',
    description: 'Discover, rate, and share your favorite entertainment content.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Revius - Entertainment Rating Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revius - Rate Movies, Books, Games & TV Shows',
    description: 'Discover, rate, and share your favorite entertainment content.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}