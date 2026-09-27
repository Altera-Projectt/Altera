# ALTERA — Complete Project Brief for UI Redesign Planning

> **Mục đích:** Tài liệu này chứa MỌI THỨ về dự án ALTERA để một AI khác có thể hiểu toàn bộ hệ thống và lên kế hoạch nâng cấp giao diện chi tiết nhất.

---

## 1. TỔNG QUAN DỰ ÁN

**ALTERA** là một nền tảng thời trang (fashion e-commerce) tích hợp AI, cho phép người dùng:
- Mua sắm quần áo, giày, phụ kiện
- Sử dụng AI Stylist để nhận gợi ý phối đồ
- Thiết kế áo custom bằng AI (Design Studio)
- Chat với AI về thời trang
- Quản lý đơn hàng, wishlist, giỏ hàng

**Design Philosophy:** Fashion Brand, Premium, Clean, Minimal, Modern, Dark Mode (Apple Style).

---

## 2. TECH STACK

### Frontend (FE/)
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19.x | UI Library |
| TypeScript | 6.x | Type safety (strict mode) |
| Vite | 8.x | Build tool |
| Tailwind CSS | v4 | Styling (dùng `@theme {}` thay vì tailwind.config) |
| React Router | v7 | Routing (`createBrowserRouter`) |
| Zustand | 5.x | Global state management |
| Axios | 1.x | HTTP client (JWT interceptor tự động) |
| React Hook Form + Zod | 7.x / 4.x | Form validation |
| Framer Motion | 12.x | Animations |
| Radix UI | latest | Accessible primitives (Dialog, Tabs, Tooltip, Label, Separator) |
| CVA (class-variance-authority) | 0.7 | Component variant styling |
| Lucide React | 1.x | Icons |
| Sonner | 2.x | Toast notifications |
| Google OAuth | @react-oauth/google | Google login |

### Backend (BE/)
| Công nghệ | Vai trò |
|---|---|
| Node.js + Express | REST API |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| Cloudinary | Image hosting |
| Cerebras AI | AI engine (Stylist, Chat, Design) |
| MoMo API | Payment gateway (chưa cấu hình) |
| VietQR | Bank transfer QR code |

### Hosting
- **Backend:** Render (`altera-2v4j.onrender.com`)
- **Frontend:** Chạy local (`localhost:5173`), API trỏ tới Render

---

## 3. TOÀN BỘ API ENDPOINTS

Base URL: `https://altera-2v4j.onrender.com/api/v1`

### 3.1 Auth (`/auth`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/google` | Đăng nhập Google | ❌ |
| GET | `/auth/me` | Lấy thông tin user hiện tại | ✅ |

### 3.2 Users (`/users`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/users/profile` | Get profile | ✅ |
| PUT | `/users/profile` | Update profile (multipart) | ✅ |
| PUT | `/users/me/basic` | Update basic info (name, bio, location) | ✅ |
| PUT | `/users/me/measurements` | Update measurements (height, weight, size) | ✅ |
| PUT | `/users/me/preferences` | Update style preferences | ✅ |
| POST | `/users/me/avatar` | Upload avatar | ✅ |
| POST | `/users/me/cover` | Upload cover image | ✅ |
| GET | `/users/me/activities` | Get user activities | ✅ |
| DELETE | `/users/profile` | Delete account | ✅ |
| GET | `/users/` | Get all users (Admin) | ✅ Admin |

### 3.3 Products (`/products`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/products` | List products (filters: category, search, minPrice, maxPrice, page, limit) | ❌ |
| GET | `/products/:id` | Get product detail | ❌ |
| POST | `/products` | Create product (Admin, multipart) | ✅ Admin |
| PUT | `/products/:id` | Update product (Admin, multipart) | ✅ Admin |
| DELETE | `/products/:id` | Delete product (Admin) | ✅ Admin |

### 3.4 Cart (`/cart`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/cart` | Get user cart | ✅ |
| POST | `/cart/add` | Add item to cart | ✅ |
| PUT | `/cart/update` | Update item quantity | ✅ |
| DELETE | `/cart/remove/:productId` | Remove item from cart | ✅ |
| DELETE | `/cart/clear` | Clear entire cart | ✅ |

### 3.5 Wishlist (`/wishlist`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/wishlist` | Get user wishlist | ✅ |
| POST | `/wishlist` | Add product to wishlist | ✅ |
| DELETE | `/wishlist/:productId` | Remove from wishlist | ✅ |

### 3.6 Orders (`/orders`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/orders` | Create order (items, shippingAddress, paymentMethod, checkoutKey) | ✅ |
| GET | `/orders/my-orders` | Get user's orders (paginated) | ✅ |
| GET | `/orders/:id` | Get order detail | ✅ |

### 3.7 Payments (`/payments`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/payments/:orderId/status` | Get payment status | ✅ |
| POST | `/payments/:orderId/momo` | Initiate MoMo payment | ✅ |
| POST | `/payments/:orderId/bank/retry` | Retry bank transfer | ✅ |
| POST | `/payments/webhook/momo` | MoMo IPN callback | ❌ (webhook) |
| POST | `/payments/webhook/vietqr` | Bank webhook callback | ❌ (webhook) |

### 3.8 AI Stylist (`/stylist`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/stylist/quiz` | Phân tích quiz, detect phong cách | ✅ |
| POST | `/stylist/recommend` | Gợi ý outfit đầy đủ (style, colorGuide, completeOutfit, tips, products) | ✅ |
| POST | `/stylist/save` | Lưu recommendation vào lịch sử | ✅ |
| GET | `/stylist/history` | Lấy lịch sử gợi ý (paginated) | ✅ |

### 3.9 AI Chat (`/chat`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/chat` | Get all chats | ✅ |
| POST | `/chat` | Create new chat | ✅ |
| GET | `/chat/:id` | Get chat detail with messages | ✅ |
| POST | `/chat/:id/messages` | Send message, get AI reply | ✅ |
| DELETE | `/chat/:id` | Delete chat | ✅ |

### 3.10 Design Studio (`/designs`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/designs/generate` | AI generate design từ prompt | ✅ |
| POST | `/designs/:id/refine` | Refine design với prompt mới | ✅ |
| POST | `/designs/:id/save` | Save design (DRAFT → SAVED) | ✅ |
| POST | `/designs/:id/order` | Order design thành sản phẩm | ✅ |
| GET | `/designs/my` | Get user's designs (paginated) | ✅ |
| GET | `/designs/generate/history` | Get generation history | ✅ |
| DELETE | `/designs/generate/history` | Clear generation history | ✅ |
| GET | `/designs/:id` | Get single design | ✅ |
| DELETE | `/designs/:id` | Delete design | ✅ |

### 3.11 Outfit Recommendations (`/outfit`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/outfit/recommend` | Get AI outfit recommendation | ✅ |
| GET | `/outfit/history` | Get recommendation history | ✅ |

### 3.12 Admin (`/admin`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/admin/dashboard` | Dashboard stats | ✅ Admin |
| GET | `/admin/orders` | All orders | ✅ Admin |
| GET | `/admin/orders/:id` | Order detail | ✅ Admin |
| PATCH | `/admin/orders/:id/status` | Update order status | ✅ Admin |
| GET | `/admin/payments` | All payments | ✅ Admin |
| PATCH | `/admin/payments/:orderId/confirm` | Confirm payment | ✅ Admin |
| PATCH | `/admin/payments/:orderId/reject` | Reject payment | ✅ Admin |
| GET | `/admin/products` | All products | ✅ Admin |
| POST | `/admin/products` | Create product | ✅ Admin |
| PUT | `/admin/products/:id` | Update product | ✅ Admin |
| DELETE | `/admin/products/:id` | Delete product | ✅ Admin |
| GET | `/admin/users` | All users | ✅ Admin |
| PATCH | `/admin/users/:id/role` | Change user role | ✅ Admin |
| PATCH | `/admin/users/:id/toggle` | Toggle user active | ✅ Admin |
| GET | `/admin/customers` | All customers with stats | ✅ Admin |

---

## 4. FRONTEND — CẤU TRÚC HIỆN TẠI

### 4.1 Routing Map
```
/                         → HomePage (public)
/products                 → ProductsPage (public)
/products/:id             → ProductDetailPage (public)
/about                    → AboutPage (public)
/membership               → MembershipPage (public)
/auth/login               → LoginPage (public)
/auth/register            → RegisterPage (public)

/orders                   → OrdersPage (protected)
/orders/success/:id       → OrderSuccessPage (protected)
/outfit                   → OutfitPage (protected)
/design                   → DesignStudioPage (protected)
/designs                  → MyDesignsPage (protected)
/profile                  → ProfilePage (protected)
/cart                     → CartPage (protected)
/chat                     → ChatPage (protected)
/checkout                 → CheckoutPage (protected)
/wishlist                 → WishlistPage (protected)

/admin                    → AdminDashboardPage (admin)
/admin/dashboard          → AdminDashboardPage (admin)
/admin/products           → AdminProductsPage (admin)
/admin/orders             → AdminOrdersPage (admin)
/admin/payments           → AdminPaymentOrdersPage (admin)
/admin/customers          → AdminCustomersPage (admin)
/admin/users              → AdminUsersPage (admin)
```

### 4.2 Layouts
- **MainLayout**: Fixed Navbar (top) + `<Outlet />` + Footer (bottom)
- **AdminLayout**: Sidebar (left, 260px) + `<Outlet />` (right, scrollable)

### 4.3 UI Components (src/components/ui/)
| Component | Mô tả |
|---|---|
| `Button` | CVA variants: primary, secondary, outline, ghost, danger. Sizes: sm, md, lg, icon. Supports `asChild` (Radix Slot) |
| `Input` | With label, error, leftIcon, rightIcon |
| `Card` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `Badge` | Variants: default, secondary, outline, success, warning, danger, accent, muted |
| `Modal` | Radix Dialog wrapper with overlay, content (size: sm/md/lg/xl/full), header, footer, title, description |
| `Skeleton` | Skeleton loading placeholder |
| `Spinner` | Spinning loading indicator (sm/md/lg) |
| `LoadingState` | Full page or inline loading with skeleton rows |
| `GridLoadingState` | Grid skeleton for product grids |
| `ErrorState` | Error display with retry button |
| `EmptyState` | Empty data display with icon + CTA |
| `ColorSwatch` | Color circle selector |

### 4.4 Shared Components (src/components/shared/)
| Component | Mô tả |
|---|---|
| `Navbar` | Logo, nav links (Collection, AI Stylist, Design Studio), search, cart badge, auth buttons, mobile menu |
| `Footer` | Brand copy, nav columns (Shop, Studio, Support), social links |
| `SearchBar` | Debounced search input with clear button |

### 4.5 Feature Components
| Directory | Mô tả |
|---|---|
| `components/fashion/ProductCard.tsx` | Product card component |
| `components/chat/FloatingAIChat.tsx` | Floating AI chat widget |

### 4.6 State Management (Zustand Stores)
| Store | State |
|---|---|
| `authStore` | user, token, isAuthenticated, login(), logout(), updateUser() — persisted to localStorage |
| `cartStore` | cart, loading, totalItems(), fetchCart() |
| `uiStore` | sidebarOpen, mobileMenuOpen, searchOpen, cartOpen + toggles |

### 4.7 Services (API Layer)
| Service | Endpoints |
|---|---|
| `AuthService` | login, loginWithGoogle, register, getMe, updateProfile, updateAvatar, updateCoverImage, updateMeasurements, updatePreferences, deleteAccount |
| `ProductService` | getProducts, getProduct |
| `CartService` | getCart, addToCart, updateQuantity, removeItem, clearCart |
| `WishlistService` | getWishlist, addToWishlist, removeFromWishlist |
| `OrderService` | getMyOrders, getOrder, createOrder |
| `PaymentService` | status, createMomo, retryBank |
| `StylistService` | analyzeQuiz, recommend, getHistory |
| `ChatService` | getChats, createChat, getChat, sendMessage, deleteChat |
| `DesignService` | generateDesign, refineDesign, saveDesign, orderDesign, getMyDesigns, getGenerationHistory, clearGenerationHistory, getDesign, deleteDesign |
| `AdminService` | dashboard, orders, order, updateOrder, payments, confirmPayment, rejectPayment, products, createProduct, updateProduct, deleteProduct, users, updateRole, toggleUser, customers |

---

## 5. DESIGN SYSTEM — THEME TOKENS

### 5.1 Colors (Dark Mode)
```
Background:         #111111
Foreground:         #e5e5e5
Card:               #18181b
Card Foreground:    #e5e5e5
Muted:              #1a1a1a
Muted Foreground:   #a1a1aa
Border:             #27272a
Accent:             #e11d48 (Rose Red)
Primary:            #ffffff
Primary Foreground: #111111
Neutral:            #27272a
```

### 5.2 Typography
```
Heading: "Neue Power", "Montserrat", "Archivo", "Inter", system-ui
Body:    "Neue Power", "Inter", system-ui
```

### 5.3 Spacing
```
Navbar height: 72px
Sidebar width: 260px
```

### 5.4 Border Radius
```
sm: 4px | md: 8px | lg: 12px | xl: 16px | 2xl: 24px | full: 9999px
```

---

## 6. DATA MODELS (TypeScript Types)

### User
```ts
{
  _id, id, fullName, email, authProvider, avatar, coverImage,
  bio, location, role: 'USER' | 'ADMIN',
  measurements: { height, weight, shirtSize, shoeSize },
  preferences: { styles[], favoriteColors[], avoidColors[] },
  createdAt, updatedAt
}
```

### Product
```ts
{
  _id, name, slug, description, category, style, fit, material,
  brand, gender, price, discountPrice, imageUrl, images[],
  colors: [{ name, hex, imageUrl, stock }],
  sizes: [{ label, stock, measurements }],
  stock, tags[], rating, sold, isFeatured, isActive,
  createdAt, updatedAt
}
```

### Order
```ts
{
  _id, userId, items: [{ productId, quantity, price, name, imageUrl }],
  totalPrice, status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED',
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'MOMO',
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED',
  shippingAddress: { fullName, phone, street, city, province, country },
  note, statusHistory[]
}
```

### Cart
```ts
{
  _id, userId, items: [{ productId (populated), quantity, price }], totalItems, totalPrice
}
```

### Chat
```ts
{
  _id, userId, title, topic: 'general' | 'fashion' | 'outfit' | 'style',
  messages: [{ sender: 'USER' | 'AI', text, createdAt }]
}
```

---

## 7. TEST ACCOUNTS

| Role | Email | Password |
|---|---|---|
| Admin | admin@altera.vn | admin123 |
| User 1 | customer1@altera.vn | password123 |
| User 2 | customer2@altera.vn | password123 |

---

## 8. CODING RULES (BẮT BUỘC TUÂN THỦ)

1. **TypeScript strict mode** — Không dùng `any` trừ khi bắt buộc
2. **Không inline styles** — Chỉ dùng Tailwind CSS classes + CSS variables
3. **Không hardcode colors/sizes** — Dùng design tokens (`var(--color-*)`, `var(--radius-*)`)
4. **Component pattern**: CVA + Radix UI + `forwardRef` + `cn()` utility
5. **Business logic trong `features/`**, UI components trong `components/`
6. **Zustand** cho global state, **React Hook Form + Zod** cho forms
7. **Import paths**: Dùng `@/` alias (mapped to `src/`)
8. **Barrel exports**: Mỗi thư mục component có `index.ts`
9. **Không tạo file mới nếu có thể sửa file hiện tại**
10. **Responsive**: Mobile-first approach

---

## 9. CURRENT STATUS — CÁI GÌ ĐÃ CÓ, CÁI GÌ CẦN NÂNG CẤP

### ✅ Đã hoàn thành (functional)
- Toàn bộ API backend
- Authentication (login, register, Google OAuth)
- Product listing + detail
- Cart + Checkout + Payment (COD, Bank Transfer)
- Order management (user + admin)
- AI Stylist (quiz + recommend)
- AI Chat
- Design Studio (generate + refine + save + order)
- Wishlist
- Profile management (avatar, cover, measurements, preferences)
- Admin dashboard, products, orders, payments, users, customers

### 🎨 Cần nâng cấp UI
- Tất cả các trang đều **functional nhưng UI cơ bản**
- Cần redesign theo Figma mới
- Cần thêm animations, micro-interactions
- Cần responsive hoàn chỉnh hơn
- Cần consistent design system across all pages

---

*Tài liệu này bao gồm đầy đủ: Tech stack, toàn bộ API endpoints, cấu trúc frontend, design tokens, data models, coding rules, và trạng thái hiện tại. Đủ để lên kế hoạch redesign chi tiết từng trang.*
