import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'

type Customer = { _id: string; fullName: string; email: string; phone?: string; role: string; isActive?: boolean; createdAt: string }
const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải danh sách khách hàng.'
const surface = 'overflow-hidden rounded-lg border border-white/[0.07] bg-[#101010]'

export function AdminCustomersPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = () => {
    setLoading(true)
    AdminService.customers({ search, status: status || undefined, page, limit: 20 })
      .then((response) => { setItems(response.data.data.users as Customer[]); setTotalPages(response.data.data.pagination.totalPages || 1) })
      .catch((reason: unknown) => setError(errorText(reason)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    AdminService.customers({ search, status: status || undefined, page, limit: 20 })
      .then((response) => { if (active) { setItems(response.data.data.users as Customer[]); setTotalPages(response.data.data.pagination.totalPages || 1) } })
      .catch((reason: unknown) => { if (active) setError(errorText(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, status, page])

  const toggle = async (customer: Customer) => {
    if (!window.confirm(`${customer.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản ${customer.fullName}?`)) return
    setError('')
    try { await AdminService.updateUser(customer._id, { isActive: customer.isActive === false }); load() }
    catch (reason: unknown) { setError(errorText(reason)) }
  }

  return <section className="mx-auto max-w-[1500px] space-y-7 text-neutral-100">
    <header className="space-y-2">
      <h1 className="bg-gradient-to-b from-cyan-300 to-blue-600 bg-clip-text text-3xl font-extrabold normal-case tracking-tight text-transparent sm:text-4xl">Quản lý khách hàng</h1>
      <p className="text-sm text-neutral-400">Tra cứu tài khoản khách hàng và quản lý trạng thái truy cập.</p>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Tìm tài khoản</span>
        <input aria-label="Tìm tài khoản theo tên hoặc email" placeholder="Tìm tài khoản" value={search} onChange={(event) => { setError(''); setSearch(event.target.value); setPage(1) }} className="h-12 w-full rounded-lg border border-neutral-500 bg-transparent px-4 text-sm text-white placeholder:text-neutral-400 focus-visible:border-cyan-400 focus-visible:outline-cyan-400" />
      </label>
      <label className="relative w-full sm:max-w-[304px]">
        <span className="sr-only">Lọc theo trạng thái tài khoản</span>
        <select aria-label="Lọc theo trạng thái tài khoản" value={status} onChange={(event) => { setError(''); setStatus(event.target.value); setPage(1) }} className="h-12 w-full appearance-none rounded-lg border border-neutral-500 bg-[#090909] px-4 pr-10 text-sm text-neutral-200 focus-visible:border-cyan-400 focus-visible:outline-cyan-400">
          <option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã vô hiệu hóa</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"><path d="m5 9 7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      </label>
    </div>

    {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

    <article className={`${surface} p-4 sm:p-5`}>
      <h2 className="border-b border-white/10 pb-3 text-lg font-semibold normal-case tracking-normal text-cyan-400">Tài khoản khách hàng</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-xs">
          <thead className="bg-white/[0.09] text-[11px] uppercase tracking-wide text-neutral-100"><tr>{['Mã tài khoản', 'Khách hàng', 'Email', 'Số ĐT', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => <th key={label} className="px-4 py-3 first:rounded-l-lg last:rounded-r-lg">{label}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">Đang tải khách hàng…</td></tr> : items.map((customer) => <tr key={customer._id} className="border-b border-white/15 text-neutral-300 last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-cyan-400">#{customer._id.slice(-7).toUpperCase()}</td>
              <td className="max-w-48 truncate px-4 py-3">{customer.fullName || '—'}</td>
              <td className="max-w-56 truncate px-4 py-3">{customer.email}</td>
              <td className="whitespace-nowrap px-4 py-3">{customer.phone || '—'}</td>
              <td className="whitespace-nowrap px-4 py-3">{customer.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</td>
              <td className={`whitespace-nowrap px-4 py-3 ${customer.isActive === false ? 'text-red-400' : 'text-emerald-400'}`}>{customer.isActive === false ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}</td>
              <td className="whitespace-nowrap px-4 py-3">{customer.role !== 'ADMIN' && <button type="button" onClick={() => void toggle(customer)} className="rounded px-2 py-1 text-neutral-300 hover:bg-white/10 hover:text-cyan-300 focus-visible:outline-cyan-400">{customer.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'}</button>}</td>
            </tr>)}
            {!loading && !items.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">Không tìm thấy khách hàng.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-neutral-400">
        <span>{items.length} khách hàng · Trang {page} / {totalPages}</span>
        <div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Trước</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Sau</button></div>
      </footer>
    </article>
  </section>
}
