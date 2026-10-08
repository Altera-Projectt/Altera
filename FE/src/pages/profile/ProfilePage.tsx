import { useEffect, useState, useRef } from 'react'
import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { User, UpdateMeasurementsPayload, UpdatePreferencesPayload } from '@/types/user.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User as UserIcon, Camera, Ruler, Scale, Shirt, Footprints, Edit2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'
import { formatVND, extractDesignLayers, optimizeImage } from '@/utils/format'
import { ShoppingBag } from 'lucide-react'

type TabType = 'store' | 'overview' | 'measurements' | 'preferences'

export function ProfilePage() {
  const navigate = useNavigate()
  const storeUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const logout = useAuthStore((state) => state.logout)

  const [user, setUser] = useState<User | null>(storeUser)
  const [loading, setLoading] = useState(!storeUser)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<TabType>('store')

  // Edit states
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioForm, setBioForm] = useState({ bio: '', location: '' })

  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false)
  const [measurementsForm, setMeasurementsForm] = useState<UpdateMeasurementsPayload>({ height: 0, weight: 0, shirtSize: '', shoeSize: '' })

  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [preferencesForm, setPreferencesForm] = useState<UpdatePreferencesPayload>({ styles: [], favoriteColors: [], avoidColors: [] })

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Store tab state
  const [storeDesigns, setStoreDesigns] = useState<MarketplaceDesign[]>([])
  const [storeLoading, setStoreLoading] = useState(false)
  const [storeSort, setStoreSort] = useState('Newest')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!storeUser) setLoading(true)
        const response = await AuthService.getMe()
        const fetchedUser = response.data.data as any

        const actualUser = fetchedUser.user || fetchedUser
        setUser(actualUser)
        updateUser(actualUser)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (activeTab === 'store' && user) {
      const fetchStore = async () => {
        try {
          setStoreLoading(true)
          const res = await MarketplaceService.list({
            designer: (user as any)._id || (user as any).username,
            sort: storeSort,
            limit: 12
          })
          setStoreDesigns(res.data.data.designs || [])
        } catch (err) {
          console.error(err)
        } finally {
          setStoreLoading(false)
        }
      }
      fetchStore()
    }
  }, [activeTab, user, storeSort])

  // Sync forms when user changes
  useEffect(() => {
    if (user) {
      setBioForm({ bio: user.bio || '', location: user.location || '' })
      setMeasurementsForm({
        height: user.measurements?.height || 0,
        weight: user.measurements?.weight || 0,
        shirtSize: user.measurements?.shirtSize || '',
        shoeSize: user.measurements?.shoeSize || ''
      })
      setPreferencesForm({
        styles: user.preferences?.styles || [],
        favoriteColors: user.preferences?.favoriteColors || [],
        avoidColors: user.preferences?.avoidColors || []
      })
    }
  }, [user])

  const handleSaveBio = async () => {
    try {
      const res = await AuthService.updateProfile({ bio: bioForm.bio, location: bioForm.location })
      const updatedUser = (res.data.data as any).user || res.data.data
      setUser(updatedUser)
      updateUser(updatedUser)
      setIsEditingBio(false)
      toast.success('Đã cập nhật thông tin cơ bản')
    } catch {
      toast.error('Lỗi khi cập nhật thông tin')
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'coverImage') => {
    try {
      setLoading(true)
      const res = type === 'avatar'
        ? await AuthService.updateAvatar(file)
        : await AuthService.updateCoverImage(file)

      const updatedUser = (res.data.data as any).user || res.data.data
      setUser(updatedUser)
      updateUser(updatedUser)
      toast.success(`Đã cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'ảnh bìa'}`)
    } catch {
      toast.error('Lỗi khi tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMeasurements = async () => {
    try {
      const res = await AuthService.updateMeasurements(measurementsForm)
      const updatedUser = (res.data.data as any).user || res.data.data
      setUser(updatedUser)
      updateUser(updatedUser)
      setIsEditingMeasurements(false)
      toast.success('Đã cập nhật chỉ số cơ thể')
    } catch {
      toast.error('Lỗi khi cập nhật chỉ số cơ thể')
    }
  }

  const handleSavePreferences = async () => {
    try {
      // Clean up empty strings
      const cleaned = {
        styles: preferencesForm.styles?.filter(s => s.trim() !== ''),
        favoriteColors: preferencesForm.favoriteColors?.filter(s => s.trim() !== ''),
        avoidColors: preferencesForm.avoidColors?.filter(s => s.trim() !== ''),
      }
      const res = await AuthService.updatePreferences(cleaned)
      const updatedUser = (res.data.data as any).user || res.data.data
      setUser(updatedUser)
      updateUser(updatedUser)
      setIsEditingPreferences(false)
      toast.success('Đã cập nhật sở thích thời trang')
    } catch {
      toast.error('Lỗi khi cập nhật sở thích thời trang')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-[var(--color-muted)] rounded-[var(--radius-lg)]" />
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 space-y-4">
              <div className="h-64 bg-[var(--color-muted)] rounded-[var(--radius-lg)]" />
            </div>
            <div className="flex-1 h-96 bg-[var(--color-muted)] rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center flex flex-col items-center min-h-[50vh] justify-center">
        <p className="text-[var(--color-error)] mb-6 font-medium">{error || 'Profile not found'}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Thử lại</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={avatarInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'avatar')
        }}
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={coverInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'coverImage')
        }}
      />

      {/* ── Cinematic Cover & Header ────────────────────────────────── */}
      <div className="flex flex-col items-center mb-56 md:mb-64 relative">
        <div className="h-48 md:h-80 w-full bg-black overflow-hidden relative group rounded-xl">
          {user.coverImage ? (
            <img src={user.coverImage} alt="Cover" className="h-full w-full object-cover mix-blend-luminosity opacity-40 transition-transform duration-700 group-hover:scale-105" />
          ) : user.avatar ? (
            <img src={user.avatar} alt="Cover Fallback" className="h-full w-full object-cover opacity-50 blur-xl scale-110" />
          ) : (
            <div className="absolute inset-0 bg-[#E5E7EB]" />
          )}

          <div
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
          >
            <Camera className="w-3.5 h-3.5" />
            Thay đổi ảnh bìa
          </div>
        </div>

        {/* Avatar & Info */}
        <div className="absolute top-[120px] md:top-[220px] flex flex-col items-center w-full z-10 px-4">
          <div className="group relative h-32 w-32 md:h-48 md:w-48 rounded-full overflow-hidden bg-white shrink-0 border-[6px] border-[var(--color-background)] shadow-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                <UserIcon className="h-16 w-16 opacity-50" />
              </div>
            )}

            <div
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-3xl md:text-5xl font-black font-heading uppercase tracking-widest text-[var(--color-foreground)]">{user.fullName}</h1>
            <div className="text-[var(--color-muted-foreground)] text-[10px] font-bold mt-3 flex items-center justify-center gap-3 flex-wrap uppercase tracking-widest">
              <span>{user.email}</span>
              <span>•</span>
              <span>Quyền: {user.role}</span>
              <span>•</span>
              <span>{user.location || 'Chưa cập nhật vị trí'}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="bg-[#0011FF] hover:bg-[#0011FF]/90 text-white uppercase tracking-widest text-xs font-bold px-8 rounded-full h-10" onClick={() => setActiveTab('overview')}>
              Thiết lập
            </Button>
            <Button variant="primary" className="bg-[#0011FF] hover:bg-[#0011FF]/90 text-white uppercase tracking-widest text-xs font-bold px-8 rounded-full h-10" onClick={() => { logout(); navigate('/') }}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-8">
        {/* Minimalist Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-8">
            {[
              { id: 'store', label: 'Collection' },
              { id: 'overview', label: 'Tổng quan' },
              { id: 'measurements', label: 'Chỉ số cơ thể' },
              { id: 'preferences', label: 'Sở thích' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "pb-4 text-[11px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative",
                  activeTab === tab.id
                    ? "text-[var(--color-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabProfile"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-foreground)]"
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'store' && (
            <div className="hidden sm:flex text-xs font-bold uppercase tracking-widest text-[var(--color-foreground)] items-center gap-1 pb-4 relative">
              <select
                 value={storeSort}
                 onChange={(e) => setStoreSort(e.target.value)}
                 className="bg-transparent border-none outline-none cursor-pointer appearance-none uppercase text-xs font-bold text-[var(--color-foreground)]"
               >
                 <option value="Newest">Newest</option>
                 <option value="Popular">Popular</option>
                 <option value="Best Selling">Best Selling</option>
                 <option value="Price Low → High">Price Low → High</option>
                 <option value="Price High → Low">Price High → Low</option>
               </select>
               <span className="pointer-events-none">▾</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* STORE */}
            {activeTab === 'store' && (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                {storeLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] w-full bg-[var(--color-muted)] mb-4 rounded-sm" />
                        <div className="h-4 w-3/4 bg-[var(--color-muted)] rounded-sm mb-2" />
                        <div className="h-4 w-1/2 bg-[var(--color-muted)] rounded-sm" />
                      </div>
                    ))}
                  </div>
                ) : storeDesigns.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                    {storeDesigns.map((product) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="group relative flex flex-col"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-muted)] mb-4 rounded-[var(--radius-md)]">
                          <Link to={`/design/${product.slug}`}>
                            {product.thumbnail ? (
                              <>
                                <img
                                  src={optimizeImage(product.productId?.imageUrl || product.productId?.images?.[0] || product.thumbnail, 400)}
                                  alt={product.name}
                                  loading="lazy"
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {(product.productId?.imageUrl || (product.productId?.images && product.productId.images.length > 0)) && (
                                  <img
                                    src={extractDesignLayers(product.thumbnail)}
                                    alt={`${product.name} overlay`}
                                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                                  />
                                )}
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-[var(--color-border)]" strokeWidth={1} />
                              </div>
                            )}
                          </Link>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                        </div>
                        <div className="flex flex-col px-1">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <Link
                              to={`/design/${product.slug}`}
                              className="text-xs font-bold text-[var(--color-foreground)] hover:underline line-clamp-1 uppercase tracking-wider"
                            >
                              {product.name}
                            </Link>
                            <span className="text-xs font-bold whitespace-nowrap text-[var(--color-muted-foreground)]">
                              {formatVND(product.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">
                              {product.category || 'Custom Design'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-xl)] p-12 text-center bg-[var(--color-card)]/50 mt-4">
                    <p className="text-[var(--color-muted-foreground)] text-sm font-medium mb-4">Bạn chưa đăng thiết kế nào hoặc chưa có thiết kế nào phù hợp.</p>
                    <Button asChild variant="outline" size="sm" className="uppercase text-[10px] font-bold tracking-widest">
                      <Link to="/create">Tạo thiết kế mới</Link>
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <section className="bg-[var(--color-card)] p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">
                        Personal Info
                      </p>
                      <h3 className="font-heading text-2xl uppercase tracking-widest text-[var(--color-foreground)]">Bio & Giới thiệu</h3>
                    </div>
                    {!isEditingBio ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingBio(true)} className="text-[10px] uppercase font-bold tracking-widest">
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Cập nhật
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(false)} className="text-[10px] uppercase font-bold tracking-widest">Hủy</Button>
                        <Button size="sm" onClick={handleSaveBio} className="text-[10px] uppercase font-bold tracking-widest bg-white text-black hover:bg-zinc-200">Lưu</Button>
                      </div>
                    )}
                  </div>

                  {!isEditingBio ? (
                    <div className="space-y-4 text-[var(--color-muted-foreground)] leading-relaxed text-sm border-l-2 border-[var(--color-primary)] pl-6 py-2">
                      {user.bio ? (
                        <p className="italic text-base text-[var(--color-muted-foreground)]">"{user.bio}"</p>
                      ) : (
                        <p className="text-[var(--color-muted-foreground)]/60">Chưa có giới thiệu.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Tiểu sử</label>
                        <textarea
                          className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all resize-none"
                          rows={4}
                          placeholder="Viết một vài dòng về phong cách của bạn..."
                          value={bioForm.bio}
                          onChange={(e) => setBioForm(prev => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Thành phố / Vị trí</label>
                        <Input
                          value={bioForm.location}
                          onChange={(e) => setBioForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="VD: Hồ Chí Minh, VN"
                        />
                      </div>
                    </div>
                  )}
                </section>

                <section className="pt-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">
                    Timeline
                  </p>
                  <h3 className="font-heading text-2xl uppercase tracking-widest text-[var(--color-foreground)] mb-6">Hoạt động gần đây</h3>
                  <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-xl)] p-12 text-center bg-[var(--color-card)]/50">
                    <p className="text-[var(--color-muted-foreground)] text-sm font-medium">Chưa có hoạt động nào nổi bật.</p>
                  </div>
                </section>
              </motion.div>
            )}

            {/* MEASUREMENTS */}
            {activeTab === 'measurements' && (
              <motion.div
                key="measurements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 bg-[var(--color-card)] p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-lg"
              >
                <div className="flex items-center justify-between mb-8 border-b border-[var(--color-border)]/50 pb-6">
                  <div>
                    <h3 className="font-heading text-2xl uppercase tracking-widest text-[var(--color-foreground)] mb-2">Chỉ số cơ thể</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed max-w-md">
                      Hồ sơ kích cỡ giúp AI Stylist đưa ra gợi ý size chính xác nhất khi bạn mua sắm.
                    </p>
                  </div>
                  {!isEditingMeasurements ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingMeasurements(true)} className="text-[10px] uppercase font-bold tracking-widest shrink-0">
                      <Edit2 className="w-3.5 h-3.5 mr-2" /> Cập nhật
                    </Button>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingMeasurements(false)} className="text-[10px] uppercase font-bold tracking-widest">Hủy</Button>
                      <Button size="sm" onClick={handleSaveMeasurements} className="text-[10px] uppercase font-bold tracking-widest bg-white text-black hover:bg-zinc-200">Lưu</Button>
                    </div>
                  )}
                </div>

                {!isEditingMeasurements ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: Ruler, label: 'Chiều cao', value: user.measurements?.height ? `${user.measurements.height} cm` : '--' },
                      { icon: Scale, label: 'Cân nặng', value: user.measurements?.weight ? `${user.measurements.weight} kg` : '--' },
                      { icon: Shirt, label: 'Size Áo', value: user.measurements?.shirtSize || '--' },
                      { icon: Footprints, label: 'Size Giày', value: user.measurements?.shoeSize || '--' },
                    ].map((item, i) => (
                      <div key={i} className="p-6 flex flex-col items-center justify-center text-center bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-zinc-700 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-4 border border-[var(--color-border)]">
                          <item.icon className="w-5 h-5 text-[var(--color-foreground)]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">{item.label}</span>
                        <span className="font-heading text-xl font-bold text-[var(--color-foreground)]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Chiều cao (cm)</label>
                      <Input
                        type="number"
                        value={measurementsForm.height || ''}
                        onChange={(e) => setMeasurementsForm(prev => ({ ...prev, height: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Cân nặng (kg)</label>
                      <Input
                        type="number"
                        value={measurementsForm.weight || ''}
                        onChange={(e) => setMeasurementsForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Size Áo</label>
                      <select
                        className="w-full h-10 px-3 text-sm bg-transparent border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-foreground)] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all appearance-none"
                        value={measurementsForm.shirtSize || ''}
                        onChange={(e) => setMeasurementsForm(prev => ({ ...prev, shirtSize: e.target.value }))}
                      >
                        <option value="" className="bg-[var(--color-card)]">Chọn size</option>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s} className="bg-[var(--color-card)]">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Size Giày (VD: 42 EU)</label>
                      <Input
                        value={measurementsForm.shoeSize || ''}
                        onChange={(e) => setMeasurementsForm(prev => ({ ...prev, shoeSize: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* PREFERENCES */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 bg-[var(--color-card)] p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-lg"
              >
                <div className="flex items-center justify-between mb-8 border-b border-[var(--color-border)]/50 pb-6">
                  <div>
                    <h3 className="font-heading text-2xl uppercase tracking-widest text-[var(--color-foreground)] mb-2">Sở thích thời trang</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed max-w-md">
                      Được dùng bởi AI Stylist để đưa ra các gợi ý trang phục hoàn hảo cho riêng bạn.
                    </p>
                  </div>
                  {!isEditingPreferences ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingPreferences(true)} className="text-[10px] uppercase font-bold tracking-widest shrink-0">
                      <Edit2 className="w-3.5 h-3.5 mr-2" /> Cập nhật
                    </Button>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingPreferences(false)} className="text-[10px] uppercase font-bold tracking-widest">Hủy</Button>
                      <Button size="sm" onClick={handleSavePreferences} className="text-[10px] uppercase font-bold tracking-widest bg-white text-black hover:bg-zinc-200">Lưu</Button>
                    </div>
                  )}
                </div>

                {!isEditingPreferences ? (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white" /> Phong cách yêu thích
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {user.preferences?.styles?.length ? user.preferences.styles.map((style) => (
                          <div key={style} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-foreground)] border border-zinc-700 rounded-full bg-[var(--color-background)]">
                            {style}
                          </div>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)] italic">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-zinc-500" /> Màu sắc thường mặc
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {user.preferences?.favoriteColors?.length ? user.preferences.favoriteColors.map((color) => (
                          <div key={color} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-foreground)] bg-zinc-800 rounded-full">
                            {color}
                          </div>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)] italic">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-900/50" /> Màu sắc nên tránh
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {user.preferences?.avoidColors?.length ? user.preferences.avoidColors.map((color) => (
                          <div key={color} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] border-dashed rounded-full bg-[var(--color-background)]/50">
                            {color}
                          </div>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)] italic">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-8 p-6 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Phong cách yêu thích (cách nhau bằng dấu phẩy)</label>
                      <Input
                        value={preferencesForm.styles?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, styles: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Minimalist, Streetwear"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Màu sắc thường mặc (cách nhau bằng dấu phẩy)</label>
                      <Input
                        value={preferencesForm.favoriteColors?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, favoriteColors: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Đen, Trắng, Xanh Navy"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Màu sắc nên tránh (cách nhau bằng dấu phẩy)</label>
                      <Input
                        value={preferencesForm.avoidColors?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, avoidColors: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Vàng neon, Hồng cánh sen"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
