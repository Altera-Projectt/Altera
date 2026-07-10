import { Outlet } from 'react-router-dom'
import { Navbar, Footer } from '@/components/shared'
import { FloatingAIChat } from '@/components/chat'

/**
 * ALTERA Main Layout
 * Used for all public-facing pages (Home, Products, Studio, etc.)
 * Includes fixed Navbar and standard Footer.
 */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      {/* 
        The top margin offsets the fixed navbar height.
        flex-1 ensures the footer is pushed to the bottom if content is short.
      */}
      <main className="flex-1 mt-[var(--spacing-navbar)]">
        <Outlet />
      </main>
      <Footer />
      <FloatingAIChat />
    </div>
  )
}
