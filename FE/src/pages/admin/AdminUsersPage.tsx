import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'

type AdminUser = {
  _id: string
  fullName: string
  email: string
  role: 'USER' | 'ADMIN'
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
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState<PageInfo>({ total: 0, page: 1, limit: 20, totalPages: 0 })

  useEffect(() => {
    let current = true
    AdminService.users({
      search: search.trim() || undefined,
      role: role || undefined,
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
  }, [search, role, status, page])

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

  return (
    <section className="mx-auto max-w-[1500px] space-y-6 text-slate-100">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">NGƯỜI DÙNG &amp; KHÁCH HÀNG</p>
          <h1 className="mt-2 text-3xl font-bold normal-case tracking-normal text-slate-100">
            Quản lý tài khoản
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tra cứu tập trung thông tin khách hàng, quản trị viên và quản lý trạng thái truy cập.
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
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => {
            setLoading(true)
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-blue-400/15 bg-[#162038]/80 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <tr>
                {['Mã tài khoản', 'Họ tên', 'Email', 'Số ĐT', 'Vai trò', 'Trạng thái', 'Ngày đăng ký', 'Thao tác'].map((label) => (
                  <th key={label} className="px-4 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">Đang tải danh sách tài khoản…</td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr key={user._id} className="border-t border-blue-400/10 transition-colors hover:bg-blue-500/[0.05]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-400">
                      #{user._id.slice(-7).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">{user.fullName || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{user.email}</td>
                    <td className="px-4 py-3 text-slate-300">{user.phone || '—'}</td>
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
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">Không tìm thấy tài khoản phù hợp.</td>
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
    </section>
  )
}
