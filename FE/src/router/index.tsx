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
import { AboutPage } from '@/pages/about/AboutPage'
import { MembershipPage } from '@/pages/membership/MembershipPage'

// Protected Pages
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { OrderSuccessPage } from '@/pages/orders/OrderSuccessPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { CartPage } from '@/pages/cart/CartPage'
import { ChatPage } from '@/pages/chat/ChatPage'
import { CheckoutPage } from '@/pages/checkout/CheckoutPage'
import { WishlistPage } from '@/pages/wishlist/WishlistPage'
import { DesignerProfilePage } from '@/pages/designer/DesignerProfilePage'
import { DesignDetailPage } from '@/pages/designer/DesignDetailPage'
import { DesignerDashboardPage } from '@/pages/designer/DesignerDashboardPage'
import { MyDesignsPage } from '@/pages/design/MyDesignsPage'

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminPaymentOrdersPage } from '@/pages/admin/AdminPaymentOrdersPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage'
import { AdminDesignsPage } from '@/pages/admin/AdminDesignsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'designer/:username', element: <DesignerProfilePage /> },
      { path: 'design/:slug', element: <DesignDetailPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'membership', element: <MembershipPage /> },
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
          { path: 'outfit', element: <OutfitPage /> },
          { path: 'design', element: <DesignStudioPage /> },
          { path: 'orders/success/:id', element: <OrderSuccessPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'designs', element: <MyDesignsPage /> },
          { path: 'designer/dashboard', element: <DesignerDashboardPage /> },
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
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'payments', element: <AdminPaymentOrdersPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'designs', element: <AdminDesignsPage /> },
        ],
      },
    ],
  },
])

