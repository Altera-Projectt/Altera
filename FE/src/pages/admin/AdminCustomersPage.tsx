import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'

type Customer = { _id: string; fullName: string; email: string; phone?: string; role: string; isActive?: boolean; createdAt: string }
const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải danh sách khách hàng.'
const surface = 'overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20'

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

  return <section className="mx-auto max-w-[1500px] space-y-7 text-slate-100">
    <header className="space-y-2">
      <h1 className="bg-gradient-to-b from-cyan-300 to-blue-500 bg-clip-text text-3xl font-extrabold normal-case tracking-tight text-transparent sm:text-4xl">Quản lý khách hàng</h1>
      <p className="text-sm text-slate-400">Tra cứu tài khoản khách hàng và quản lý trạng thái truy cập.</p>
    </header>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Tìm tài khoản</span>
        <input aria-label="Tìm tài khoản theo tên hoặc email" placeholder="Tìm tài khoản" value={search} onChange={(event) => { setError(''); setSearch(event.target.value); setPage(1) }} className="h-12 w-full rounded-lg border border-blue-400/20 bg-[#162038] px-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none" />
      </label>
      <label className="relative w-full sm:max-w-[304px]">
        <span className="sr-only">Lọc theo trạng thái tài khoản</span>
        <select aria-label="Lọc theo trạng thái tài khoản" value={status} onChange={(event) => { setError(''); setStatus(event.target.value); setPage(1) }} className="h-12 w-full appearance-none rounded-lg border border-blue-400/20 bg-[#162038] px-4 pr-10 text-sm text-white focus:border-cyan-400 focus:outline-none">
          <option value="" className="bg-[#0F172A] text-white">Tất cả trạng thái</option><option value="active" className="bg-[#0F172A] text-white">Đang hoạt động</option><option value="inactive" className="bg-[#0F172A] text-white">Đã vô hiệu hóa</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><path d="m5 9 7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
      </label>
    </div>

    {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

    <article className={`${surface} p-4 sm:p-5`}>
      <h2 className="border-b border-blue-400/15 pb-3 text-lg font-semibold normal-case tracking-normal text-cyan-400">Tài khoản khách hàng</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-xs">
          <thead className="bg-[#162038]/80 text-[11px] uppercase tracking-wider font-semibold text-slate-300 border-b border-blue-400/15"><tr>{['Mã tài khoản', 'Khách hàng', 'Email', 'Số ĐT', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => <th key={label} className="px-4 py-3 first:rounded-l-lg last:rounded-r-lg">{label}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Đang tải khách hàng…</td></tr> : items.map((customer) => <tr key={customer._id} className="border-b border-blue-400/10 text-slate-300 hover:bg-blue-500/[0.05] transition-colors last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-cyan-400">#{customer._id.slice(-7).toUpperCase()}</td>
              <td className="max-w-48 truncate px-4 py-3 font-medium text-white">{customer.fullName || '—'}</td>
              <td className="max-w-56 truncate px-4 py-3 text-slate-300">{customer.email}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-300">{customer.phone || '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-300">{customer.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</td>
              <td className="whitespace-nowrap px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${customer.isActive === false ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>{customer.isActive === false ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}</span></td>
              <td className="whitespace-nowrap px-4 py-3">{customer.role !== 'ADMIN' && <button type="button" onClick={() => void toggle(customer)} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-2.5 py-1 text-slate-200 hover:bg-blue-500/20 transition">{customer.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'}</button>}</td>
            </tr>)}
            {!loading && !items.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Không tìm thấy khách hàng.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-400/15 pt-4 text-sm text-slate-400">
        <span>{items.length} khách hàng · Trang {page} / {totalPages}</span>
        <div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-slate-200 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition">Trước</button><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 text-slate-200 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition">Sau</button></div>
      </footer>
    </article>
  </section>
}
