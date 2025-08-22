import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Providers } from '@/providers'

// Pages
import HomePage from '@/pages/HomePage'
import MoviesPage from '@/pages/MoviesPage'
import BooksPage from '@/pages/BooksPage'
import GamesPage from '@/pages/GamesPage'
import TVPage from '@/pages/TVPage'
import CommunityPage from '@/pages/CommunityPage'
import ListsPage from '@/pages/ListsPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'

function App() {
  return (
    <div className="font-inter font-sans" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <Providers>
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/tv" element={<TVPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
      </Providers>
    </div>
  )
}

export default App