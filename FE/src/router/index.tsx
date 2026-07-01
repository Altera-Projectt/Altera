import { createBrowserRouter } from 'react-router-dom'

// Layouts
import { MainLayout, AdminLayout } from '@/layouts'
import { ProtectedRoute } from './ProtectedRoute'

// Public Pages
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { OutfitPage } from '@/pages/outfit/OutfitPage'
import { DesignStudioPage } from '@/pages/design/DesignStudioPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Protected Pages
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { CartPage } from '@/pages/cart/CartPage'
import { ChatPage } from '@/pages/chat/ChatPage'

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'outfit', element: <OutfitPage /> },
      { path: 'design', element: <DesignStudioPage /> },
      {
        path: 'auth',
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      // Protected User Routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'orders', element: <OrdersPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'chat', element: <ChatPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Admin Routes
  {
    path: '/admin',
    element: <ProtectedRoute requireAdmin />,
    errorElement: <NotFoundPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'users', element: <AdminUsersPage /> },
        ],
      },
    ],
  },
])
