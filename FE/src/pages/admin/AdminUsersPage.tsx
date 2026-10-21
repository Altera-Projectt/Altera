import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { Crown, Sparkles, Clock, X, CheckCircle2 } from 'lucide-react'

type AdminUser = {
  _id: string
  fullName: string
  email: string
  role: 'USER' | 'ADMIN'
  membershipTier?: 'FREE' | 'PREMIUM' | 'PRO'
  effectiveTier?: 'FREE' | 'PREMIUM' | 'PRO'
  membershipStartedAt?: string | null
  membershipExpiresAt?: string | null
  isLifetimeMembership?: boolean
  daysRemaining?: number | null
  membershipStatus?: string
  phone?: string
  isActive?: boolean
  createdAt: string
}

type PageInfo = { total: number; page: number; limit: number; totalPages: number }
type RoleTab = '' | 'USER' | 'ADMIN'

const ROLE_TABS: Array<{ label: string; value: RoleTab }> = [
  { label: 'Tất cả tài khoản', value: '' },
  { label: 'Khách hàng (Người dùng)', value: 'USER' },
  { label: 'Quản trị viên', value: 'ADMIN' },
]

const errorText = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Không thể tải danh sách tài khoản.'

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<RoleTab>('')
  const [tier, setTier] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState<PageInfo>({ total: 0, page: 1, limit: 20, totalPages: 0 })

  // Admin VIP Package Modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [selectedNewTier, setSelectedNewTier] = useState<'FREE' | 'PREMIUM' | 'PRO'>('PRO')
  const [isLifetimeSelection, setIsLifetimeSelection] = useState(false)
  const [customDays, setCustomDays] = useState(30)
  const [updatingTier, setUpdatingTier] = useState(false)

  useEffect(() => {
    let current = true
    AdminService.users({
      search: search.trim() || undefined,
      role: role || undefined,
      tier: tier || undefined,
      status: status || undefined,
      page,
      limit: 20,
    })
      .then((response) => {
        if (current) {
          setItems(response.data.data.users as AdminUser[])
          setPages(response.data.data.pagination as PageInfo)
        }
      })
      .catch((err: unknown) => {
        if (current) setError(errorText(err))
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [search, role, tier, status, page])

  const toggle = async (user: AdminUser) => {
    const nextActive = user.isActive === false
    if (!window.confirm(`${nextActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản ${user.fullName || user.email}?`)) return
    setError('')
    setNotice('')
    try {
      await AdminService.updateUser(user._id, { isActive: nextActive })
      setNotice(`Đã ${nextActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản.`)
      setItems((current) =>
        current.map((item) => (item._id === user._id ? { ...item, isActive: nextActive } : item))
      )
    } catch (err: unknown) {
      setError(errorText(err))
    }
  }

  const handleOpenEditTier = (user: AdminUser) => {
    setEditingUser(user)
    setSelectedNewTier(user.effectiveTier === 'PREMIUM' ? 'PREMIUM' : user.effectiveTier === 'PRO' ? 'PRO' : 'PRO')
    setIsLifetimeSelection(Boolean(user.isLifetimeMembership || user.role === 'ADMIN'))
    setCustomDays(user.daysRemaining && user.daysRemaining > 0 ? user.daysRemaining : 30)
  }

  const handleSaveTier = async () => {
    if (!editingUser) return
    setUpdatingTier(true)
    setError('')
    setNotice('')
    try {
      const payload: Record<string, unknown> = {
        membershipTier: selectedNewTier,
        isLifetimeMembership: isLifetimeSelection,
        durationDays: customDays,
      }
      const res = await AdminService.updateUser(editingUser._id, payload)
      const updatedUser = res.data.data.user
      setItems((current) =>
        current.map((item) => (item._id === editingUser._id ? { ...item, ...updatedUser } : item))
      )
      setNotice(`Đã cập nhật gói ${selectedNewTier}${isLifetimeSelection ? ' (VĨNH VIỄN)' : ` (${customDays} ngày)`} cho tài khoản ${editingUser.email}.`)
      setEditingUser(null)
    } catch (err: unknown) {
      setError(errorText(err))
    } finally {
      setUpdatingTier(false)
    }
  }

  return (
    <section className="mx-auto max-w-[1500px] space-y-6 text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">NGƯỜI DÙNG &amp; KHÁCH HÀNG</p>
          <h1 className="mt-2 text-3xl font-bold normal-case tracking-normal text-slate-100">
            Quản lý tài khoản
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tra cứu tập trung thông tin khách hàng, cấp bậc hội viên, thời hạn gói và quản lý quyền truy cập.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Phân loại vai trò tài khoản"
          className="inline-flex items-center gap-1 rounded-xl border border-blue-400/20 bg-[#0A1122] p-1"
        >
          {ROLE_TABS.map((tab) => {
            const active = role === tab.value
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (tab.value === role) return
                  setLoading(true)
                  setError('')
                  setNotice('')
                  setRole(tab.value)
                  setPage(1)
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-600 text-slate-100 shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:bg-[#162038] hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 shadow-lg shadow-black/20">
        <input
          aria-label="Tìm theo tên hoặc email"
          placeholder="Tìm theo họ tên hoặc email..."
          value={search}
          onChange={(e) => {
            setLoading(true)
            setSearch(e.target.value)
            setPage(1)
          }}
          className="min-w-[240px] flex-1 rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
        />

        <select
          aria-label="Lọc theo gói hội viên"
          value={tier}
          onChange={(e) => {
            setLoading(true)
            setTier(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-[#0F172A] text-slate-100">Tất cả gói hội viên</option>
          <option value="PRO" className="bg-[#0F172A] text-slate-100">Gói Pro VIP 👑</option>
          <option value="PREMIUM" className="bg-[#0F172A] text-slate-100">Gói Premium 💎</option>
          <option value="FREE" className="bg-[#0F172A] text-slate-100">Gói Miễn phí</option>
        </select>

        <select
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => {
            setLoading(true)
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-[#0F172A] text-slate-100">Tất cả trạng thái</option>
          <option value="active" className="bg-[#0F172A] text-slate-100">Đang hoạt động</option>
          <option value="inactive" className="bg-[#0F172A] text-slate-100">Đã vô hiệu hóa</option>
        </select>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      <div className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-blue-400/15 bg-[#162038]/80 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <tr>
                {[
                  'Mã tài khoản',
                  'Họ tên',
                  'Email',
                  'Gói hội viên',
                  'Thời hạn gói',
                  'Vai trò',
                  'Trạng thái',
                  'Ngày đăng ký',
                  'Thao tác',
                ].map((label) => (
                  <th key={label} className="px-4 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">Đang tải danh sách tài khoản…</td>
                </tr>
              ) : (
                items.map((user) => {
                  const isVipLifetime = Boolean(user.isLifetimeMembership || user.role === 'ADMIN')
                  const effectiveTier = user.effectiveTier || (isVipLifetime ? 'PRO' : user.membershipTier || 'FREE')
                  const isExpired = user.membershipTier && user.membershipTier !== 'FREE' && user.membershipExpiresAt && new Date(user.membershipExpiresAt) < new Date() && !isVipLifetime

                  return (
                    <tr key={user._id} className="border-t border-blue-400/10 transition-colors hover:bg-blue-500/[0.05]">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-400">
                        #{user._id.slice(-7).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">{user.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{user.email}</td>

                      {/* Gói Hội Viên */}
                      <td className="px-4 py-3">
                        {isVipLifetime ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                            <Crown className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            PRO VĨNH VIỄN
                          </span>
                        ) : effectiveTier === 'PRO' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                            <Crown className="h-3 w-3 fill-amber-400 text-amber-400" />
                            PRO VIP
                          </span>
                        ) : effectiveTier === 'PREMIUM' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-400">
                            MIỄN PHÍ
                          </span>
                        )}
                      </td>

                      {/* Thời Hạn Gói */}
                      <td className="px-4 py-3">
                        {isVipLifetime ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-amber-300">Vĩnh viễn</span>
                            <span className="text-[10px] text-slate-400">Không giới hạn</span>
                          </div>
                        ) : !isExpired && (effectiveTier === 'PRO' || effectiveTier === 'PREMIUM') ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300">
                              <Clock className="h-3 w-3 text-cyan-400" />
                              Còn {user.daysRemaining ?? 30} ngày
                            </span>
                            {user.membershipExpiresAt && (
                              <span className="text-[10px] text-slate-400">
                                Hết hạn: {new Date(user.membershipExpiresAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        ) : isExpired ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-rose-400">Đã hết hạn</span>
                            {user.membershipExpiresAt && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(user.membershipExpiresAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Vai Trò */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                            user.role === 'ADMIN'
                              ? 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-300'
                              : 'border border-blue-400/20 bg-[#162038] text-slate-300'
                          }`}
                        >
                          {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>

                      {/* Trạng Thái */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive === false
                              ? 'border border-rose-500/30 bg-rose-500/15 text-rose-400'
                              : 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {user.isActive === false ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}
                        </span>
                      </td>

                      {/* Ngày Đăng Ký */}
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Thao Tác */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTier(user)}
                            className="rounded-lg border border-cyan-400/30 bg-[#162038] px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20 transition"
                            title="Đổi gói hội viên & thời hạn"
                          >
                            Đổi gói
                          </button>

                          {user.role !== 'ADMIN' && (
                            <button
                              type="button"
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                user.isActive === false
                                  ? 'border border-emerald-500/30 bg-[#162038]/60 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'border border-rose-500/30 bg-[#162038]/60 text-rose-400 hover:bg-rose-500/20'
                              }`}
                              onClick={() => void toggle(user)}
                            >
                              {user.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">Không tìm thấy tài khoản phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-blue-400/15 p-3 text-sm text-slate-400">
          <span>{pages.total.toLocaleString()} tài khoản</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true)
                setPage((value) => value - 1)
              }}
              className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-slate-200 transition hover:bg-blue-500/20 disabled:opacity-40"
            >
              Trước
            </button>
            <span>Trang {page} / {Math.max(pages.totalPages, 1)}</span>
            <button
              type="button"
              disabled={page >= pages.totalPages || loading}
              onClick={() => {
                setLoading(true)
                setPage((value) => value + 1)
              }}
              className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-slate-200 transition hover:bg-blue-500/20 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL ADMIN ĐỔI GÓI HỘI VIÊN & THỜI HẠN
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060B16]/80 p-4 backdrop-blur-sm"
          onClick={() => !updatingTier && setEditingUser(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-cyan-400/30 bg-[#0F172A] p-6 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={updatingTier}
              onClick={() => setEditingUser(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-slate-100">Cập nhật Gói Hội Viên</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Tài khoản: <strong className="text-slate-200">{editingUser.fullName}</strong> ({editingUser.email})
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn cấp bậc:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FREE', 'PREMIUM', 'PRO'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedNewTier(t)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                        selectedNewTier === t
                          ? t === 'PRO'
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : t === 'PREMIUM'
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-700 bg-[#162038] text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'PRO' ? '👑 PRO VIP' : t === 'PREMIUM' ? '💎 PREMIUM' : 'MIỄN PHÍ'}
                    </button>
                  ))}
                </div>
              </div>

              {selectedNewTier !== 'FREE' && (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-[#162038] p-3">
                    <span className="text-xs font-medium text-slate-300">Cấp quyền Vĩnh viễn (Lifetime VIP):</span>
                    <input
                      type="checkbox"
                      checked={isLifetimeSelection}
                      onChange={(e) => setIsLifetimeSelection(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                    />
                  </div>

                  {!isLifetimeSelection && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Số ngày gia hạn (mặc định 30 ngày):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={3650}
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-slate-700 bg-[#162038] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={updatingTier}
                onClick={() => setEditingUser(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-[#162038]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={updatingTier}
                onClick={handleSaveTier}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {updatingTier ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
