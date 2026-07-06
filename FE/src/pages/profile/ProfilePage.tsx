import { useEffect, useState } from 'react'
import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/user.types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ColorSwatch } from '@/components/ui/ColorSwatch'
import { User as UserIcon, Camera, Calendar, ShieldCheck, Ruler, Scale, Shirt, Footprints, MapPin, Mail, Settings, Heart } from 'lucide-react'
import { cn } from '@/utils/cn'

type TabType = 'overview' | 'measurements' | 'preferences'

export function ProfilePage() {
  const storeUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [user, setUser] = useState<User | null>(storeUser)
  const [loading, setLoading] = useState(!storeUser)
  const [error, setError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
        <div className="animate-pulse space-y-8">
          <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-[var(--radius-lg)]" />
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-[var(--radius-lg)]" />
            </div>
            <div className="flex-1 h-96 bg-zinc-200 dark:bg-zinc-800 rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 text-center flex flex-col items-center min-h-[50vh] justify-center">
        <p className="text-rose-500 mb-6 font-medium">{error || 'Profile not found'}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Thử lại</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6 py-12 min-h-[70vh]">
      {/* ── Cover & Header ────────────────────────────────────────── */}
      <div className="relative mb-24 md:mb-32">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          {/* Cover Placeholder */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
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
            
            {/* Hover overlay (mock) */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
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
          <Card className="p-6">
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
                  <Calendar className="w-4 h-4" /> Tham gia
                </span>
                <span className="font-medium">Tháng 7, 2026</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-muted-foreground)] flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Vị trí
                </span>
                <span className="font-medium text-right">Hồ Chí Minh<br/><span className="text-xs text-[var(--color-muted-foreground)]">(Mock)</span></span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-6 uppercase tracking-widest text-xs font-semibold">
              <Settings className="w-4 h-4 mr-2" />
              Thiết lập tài khoản
            </Button>
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
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                  <h3 className="font-heading text-xl uppercase tracking-wide mb-4">Bio</h3>
                  <p className="text-[var(--color-muted-foreground)] leading-relaxed text-sm md:text-base italic border-l-2 border-[var(--color-border)] pl-4">
                    "Yêu thích sự tối giản, luôn tìm kiếm những món đồ basic có tính ứng dụng cao. Đang xây dựng một tủ đồ capsule cho riêng mình." <br/>
                    <span className="text-xs text-[var(--color-muted-foreground)]/60 not-italic uppercase tracking-widest mt-2 block">(Tính năng đang phát triển)</span>
                  </p>
                </section>
                
                <section>
                  <h3 className="font-heading text-xl uppercase tracking-wide mb-4">Hoạt động gần đây</h3>
                  <div className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center bg-[var(--color-muted)]/20">
                    <p className="text-[var(--color-muted-foreground)] text-sm font-medium">Chưa có hoạt động nào nổi bật.</p>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'measurements' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    Hồ sơ kích cỡ giúp hệ thống gợi ý size chính xác nhất khi bạn mua sắm. <br/>
                    <span className="text-xs font-semibold text-[var(--color-primary)]">(Dữ liệu minh họa)</span>
                  </p>
                  <Button variant="outline" size="sm" className="hidden sm:flex text-xs uppercase tracking-widest">
                    Cập nhật
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Ruler, label: 'Chiều cao', value: '175 cm' },
                    { icon: Scale, label: 'Cân nặng', value: '65 kg' },
                    { icon: Shirt, label: 'Size Áo', value: 'M' },
                    { icon: Footprints, label: 'Size Giày', value: '42 EU' },
                  ].map((item) => (
                    <Card key={item.label} className="p-4 flex flex-col items-center justify-center text-center group hover:border-[var(--color-primary)] transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5 text-[var(--color-foreground)]" />
                      </div>
                      <span className="text-xs uppercase tracking-widest text-[var(--color-muted-foreground)] mb-1">{item.label}</span>
                      <span className="font-heading text-lg font-bold">{item.value}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-6">
                  Được dùng bởi AI Stylist để đưa ra các gợi ý trang phục hoàn hảo cho riêng bạn. <br/>
                  <span className="text-xs font-semibold text-[var(--color-primary)]">(Dữ liệu minh họa)</span>
                </p>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Phong cách yêu thích
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Minimalist', 'Streetwear', 'Smart Casual', 'Monochrome'].map((style) => (
                      <Badge key={style} variant="secondary" className="px-3 py-1.5 text-xs font-medium rounded-md">
                        {style}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium rounded-md border-dashed text-[var(--color-muted-foreground)] cursor-pointer hover:bg-[var(--color-muted)]">
                      + Thêm
                    </Badge>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-foreground)] mb-4">
                    Bảng màu thường mặc
                  </h3>
                  <ColorSwatch colors={['Đen', 'Trắng', 'Xám', 'Xanh Navy']} variant="default" />
                </section>
                
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-foreground)] mb-4">
                    Màu sắc nên tránh
                  </h3>
                  <ColorSwatch colors={['Vàng neon', 'Hồng cánh sen']} variant="avoid" />
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
