import { useEffect, useState, useRef } from 'react'
import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { User, UpdateMeasurementsPayload, UpdatePreferencesPayload } from '@/types/user.types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { User as UserIcon, Camera, Calendar, ShieldCheck, Ruler, Scale, Shirt, Footprints, MapPin, Mail, Settings, Edit2, LogOut } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

type TabType = 'overview' | 'measurements' | 'preferences'

export function ProfilePage() {
  const navigate = useNavigate()
  const storeUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const logout = useAuthStore((state) => state.logout)
  
  const [user, setUser] = useState<User | null>(storeUser)
  const [loading, setLoading] = useState(!storeUser)
  const [error, setError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Edit states
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioForm, setBioForm] = useState({ bio: '', location: '' })
  
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false)
  const [measurementsForm, setMeasurementsForm] = useState<UpdateMeasurementsPayload>({ height: 0, weight: 0, shirtSize: '', shoeSize: '' })

  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [preferencesForm, setPreferencesForm] = useState<UpdatePreferencesPayload>({ styles: [], favoriteColors: [], avoidColors: [] })

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

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
          <div className="h-40 bg-[var(--color-muted)] rounded-[var(--radius-lg)]" />
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
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

      {/* ── Cover & Header ────────────────────────────────────────── */}
      <div className="relative mb-24 md:mb-32">
        <div className="h-48 md:h-64 w-full bg-[var(--color-muted)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          {user.coverImage ? (
             <img src={user.coverImage} alt="Cover" className="h-full w-full object-cover mix-blend-overlay opacity-50" />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
          )}
          
          {/* Cover upload button overlay */}
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors border border-white/10"
          >
            <Camera className="w-3.5 h-3.5" />
            Thay đổi ảnh bìa
          </div>
        </div>
        
        {/* Avatar */}
        <div className="absolute -bottom-16 md:-bottom-20 left-8 flex items-end gap-6">
          <div className="group relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden bg-[var(--color-background)] shrink-0 border-4 border-[var(--color-background)] shadow-md">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                <UserIcon className="h-12 w-12 opacity-50" />
              </div>
            )}
            
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="pb-2 hidden sm:block">
            <h1 className="text-3xl md:text-4xl font-bold font-heading uppercase tracking-wide">{user.fullName}</h1>
            <p className="text-[var(--color-muted-foreground)] flex items-center gap-2 mt-2 font-medium">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
          </div>
        </div>
        
        {/* Mobile Title (under avatar) */}
        <div className="mt-20 px-2 sm:hidden text-center">
          <h1 className="text-2xl font-bold font-heading uppercase tracking-wide">{user.fullName}</h1>
          <p className="text-[var(--color-muted-foreground)] flex items-center justify-center gap-2 mt-2 text-sm font-medium">
            <Mail className="w-4 h-4" /> {user.email}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* ── Left Sidebar (Info & Navigation) ────────────────────────── */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <Card className="p-6 bg-transparent border-[var(--color-border)]">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Quyền hạn
                </span>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="uppercase tracking-widest text-[10px]">
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Đăng ký bằng
                </span>
                <span className="font-medium text-xs tracking-wider">{user.authProvider || 'LOCAL'}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Vị trí
                </span>
                <span className="font-medium text-right">{user.location || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="outline" className="w-full uppercase tracking-widest text-xs font-semibold">
                <Settings className="w-4 h-4 mr-2" />
                Thiết lập
              </Button>
              <Button variant="ghost" onClick={() => { logout(); navigate('/') }} className="w-full uppercase tracking-widest text-xs font-semibold text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Right Content Area ──────────────────────────────────────── */}
        <div className="flex-1 space-y-8">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-6 border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'measurements', label: 'Chỉ số cơ thể' },
              { id: 'preferences', label: 'Sở thích thời trang' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "pb-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-colors relative",
                  activeTab === tab.id 
                    ? "text-[var(--color-foreground)]" 
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl uppercase tracking-wide">Bio & Giới thiệu</h3>
                    {!isEditingBio ? (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(true)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                        <Edit2 className="w-4 h-4 mr-2" /> Cập nhật
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(false)}>Hủy</Button>
                        <Button size="sm" onClick={handleSaveBio} className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">Lưu</Button>
                      </div>
                    )}
                  </div>
                  
                  {!isEditingBio ? (
                    <div className="space-y-4 text-[var(--color-muted-foreground)] leading-relaxed text-sm border-l-2 border-[var(--color-border)] pl-4">
                      {user.bio ? (
                        <p className="italic">"{user.bio}"</p>
                      ) : (
                        <p className="text-[var(--color-muted-foreground)]/60">Chưa có giới thiệu.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full bg-transparent border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 text-sm focus:outline-none focus:border-[var(--color-ring)]"
                        rows={4}
                        placeholder="Viết một vài dòng về phong cách của bạn..."
                        value={bioForm.bio}
                        onChange={(e) => setBioForm(prev => ({ ...prev, bio: e.target.value }))}
                      />
                      <Input 
                        label="Thành phố / Vị trí" 
                        value={bioForm.location}
                        onChange={(e) => setBioForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="VD: Hồ Chí Minh, VN"
                      />
                    </div>
                  )}
                </section>
                
                <section className="pt-8 border-t border-[var(--color-border)]">
                  <h3 className="font-heading text-xl uppercase tracking-wide mb-4">Hoạt động gần đây</h3>
                  <div className="border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center">
                    <p className="text-[var(--color-muted-foreground)] text-sm font-medium">Chưa có hoạt động nào nổi bật.</p>
                  </div>
                </section>
              </div>
            )}

            {/* MEASUREMENTS */}
            {activeTab === 'measurements' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    Hồ sơ kích cỡ giúp hệ thống gợi ý size chính xác nhất khi bạn mua sắm.
                  </p>
                  {!isEditingMeasurements ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingMeasurements(true)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                      <Edit2 className="w-4 h-4 mr-2" /> Cập nhật
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingMeasurements(false)}>Hủy</Button>
                      <Button size="sm" onClick={handleSaveMeasurements} className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">Lưu</Button>
                    </div>
                  )}
                </div>
                
                {!isEditingMeasurements ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Ruler, label: 'Chiều cao', value: user.measurements?.height ? `${user.measurements.height} cm` : '--' },
                      { icon: Scale, label: 'Cân nặng', value: user.measurements?.weight ? `${user.measurements.weight} kg` : '--' },
                      { icon: Shirt, label: 'Size Áo', value: user.measurements?.shirtSize || '--' },
                      { icon: Footprints, label: 'Size Giày', value: user.measurements?.shoeSize || '--' },
                    ].map((item) => (
                      <Card key={item.label} className="p-4 flex flex-col items-center justify-center text-center bg-transparent border border-[var(--color-border)]">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-3">
                          <item.icon className="w-5 h-5 text-[var(--color-foreground)]" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">{item.label}</span>
                        <span className="font-heading text-lg font-bold">{item.value}</span>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                    <Input 
                      label="Chiều cao (cm)" 
                      type="number"
                      value={measurementsForm.height || ''}
                      onChange={(e) => setMeasurementsForm(prev => ({ ...prev, height: Number(e.target.value) }))}
                    />
                    <Input 
                      label="Cân nặng (kg)" 
                      type="number"
                      value={measurementsForm.weight || ''}
                      onChange={(e) => setMeasurementsForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Size Áo</label>
                      <select 
                        className="w-full h-10 px-3 text-sm bg-transparent border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-ring)]"
                        value={measurementsForm.shirtSize || ''}
                        onChange={(e) => setMeasurementsForm(prev => ({ ...prev, shirtSize: e.target.value }))}
                      >
                        <option value="">Chọn size</option>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <Input 
                      label="Size Giày (VD: 42 EU)" 
                      value={measurementsForm.shoeSize || ''}
                      onChange={(e) => setMeasurementsForm(prev => ({ ...prev, shoeSize: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    Được dùng bởi AI Stylist để đưa ra các gợi ý trang phục hoàn hảo cho riêng bạn.
                  </p>
                  {!isEditingPreferences ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPreferences(true)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                      <Edit2 className="w-4 h-4 mr-2" /> Cập nhật
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingPreferences(false)}>Hủy</Button>
                      <Button size="sm" onClick={handleSavePreferences} className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">Lưu</Button>
                    </div>
                  )}
                </div>

                {!isEditingPreferences ? (
                  <>
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">Phong cách yêu thích</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.preferences?.styles?.length ? user.preferences.styles.map((style) => (
                          <Badge key={style} variant="secondary" className="px-3 py-1.5 text-xs font-medium rounded-sm border border-[var(--color-border)] bg-transparent">
                            {style}
                          </Badge>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)]">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">Màu sắc thường mặc</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.preferences?.favoriteColors?.length ? user.preferences.favoriteColors.map((color) => (
                          <Badge key={color} variant="secondary" className="px-3 py-1.5 text-xs font-medium rounded-sm bg-[var(--color-muted)] text-[var(--color-foreground)] border border-transparent">
                            {color}
                          </Badge>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)]">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-4">Màu sắc nên tránh</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.preferences?.avoidColors?.length ? user.preferences.avoidColors.map((color) => (
                          <Badge key={color} variant="outline" className="px-3 py-1.5 text-xs font-medium rounded-sm border-[var(--color-border)] opacity-60">
                            {color}
                          </Badge>
                        )) : (
                          <span className="text-sm text-[var(--color-muted-foreground)]">Chưa cập nhật</span>
                        )}
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="space-y-6 p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Phong cách yêu thích (cách nhau bằng dấu phẩy)</label>
                      <Input 
                        value={preferencesForm.styles?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, styles: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Minimalist, Streetwear"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Màu sắc thường mặc (cách nhau bằng dấu phẩy)</label>
                      <Input 
                        value={preferencesForm.favoriteColors?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, favoriteColors: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Đen, Trắng, Xanh Navy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Màu sắc nên tránh (cách nhau bằng dấu phẩy)</label>
                      <Input 
                        value={preferencesForm.avoidColors?.join(', ') || ''}
                        onChange={(e) => setPreferencesForm(prev => ({ ...prev, avoidColors: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="VD: Vàng neon, Hồng cánh sen"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
