import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

type Design = { _id: string; name: string; thumbnail?: string; thumbnailUrl?: string; price: number; category?: string; status: string; rejectionReason?: string; createdAt: string; designerId?: { displayName?: string; username?: string }; userId?: { fullName?: string; email?: string }; moderationHistory?: Array<{ status: string; reason?: string; changedAt: string; moderatorId?: string }> }
type Pagination = { total: number; page: number; limit: number; totalPages: number }
const messageOf = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tải danh sách thiết kế.'

export function AdminDesignsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Design[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = useCallback(async (page = 1) => {
    try {
      const response = await AdminService.designs({ page, limit: 20, search: search.trim() || undefined, status: status || undefined })
      setItems(response.data.data.designs as Design[]); setPagination(response.data.data.pagination as Pagination)
    } catch (error: unknown) { setError(messageOf(error)) } finally { setLoading(false) }
  }, [search, status])
  useEffect(() => {
    let active = true
    AdminService.designs({ page: 1, limit: 20, search: search.trim() || undefined, status: status || undefined })
      .then((response) => { if (active) { setItems(response.data.data.designs as Design[]); setPagination(response.data.data.pagination as Pagination) } })
      .catch((error: unknown) => { if (active) setError(messageOf(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, status])

  const moderate = async (design: Design, nextStatus: 'PUBLISHED' | 'REJECTED' | 'ARCHIVED') => {
    let rejectionReason: string | undefined
    if (nextStatus === 'REJECTED') {
      const value = window.prompt('Nhập lý do từ chối (bắt buộc):')
      if (value === null) return
      rejectionReason = value.trim()
      if (!rejectionReason || rejectionReason.length > 1000) { setError('Lý do từ chối phải có từ 1 đến 1000 ký tự.'); return }
    } else if (!window.confirm(nextStatus === 'PUBLISHED' ? `Duyệt thiết kế “${design.name}”?` : `Ẩn thiết kế “${design.name}” khỏi Marketplace?`)) return
    setBusyId(design._id); setError(''); setNotice('')
    try {
      await AdminService.moderateDesign(design._id, { status: nextStatus, rejectionReason })
      setNotice('Đã cập nhật trạng thái thiết kế.'); await load()
    } catch (error: unknown) { setError(messageOf(error)) } finally { setBusyId('') }
  }

  return <section className="mx-auto max-w-[1500px] space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6b4a]">NGƯỜI DÙNG VÀ THIẾT KẾ</p><h1 className="mt-2 text-3xl font-bold normal-case tracking-tight">Thiết kế Marketplace</h1><p className="mt-2 text-sm text-neutral-500">Kiểm duyệt, xem trạng thái đăng bán và lịch sử xử lý.</p></div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-white p-4"><label className="relative min-w-[240px] flex-1"><span className="sr-only">Tìm thiết kế hoặc người tạo</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><input value={search} onChange={(event) => { setSearch(event.target.value); setLoading(true) }} placeholder="Tìm thiết kế hoặc người tạo" className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm" /></label><select aria-label="Lọc trạng thái thiết kế" value={status} onChange={(event) => { const nextStatus = event.target.value; setStatus(nextStatus); setLoading(true); setPagination((current) => ({ ...current, page: 1 })); const params: Record<string,string> = nextStatus ? { status: nextStatus } : {}; setSearchParams(params, { replace: true }) }} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"><option value="">Tất cả trạng thái</option>{['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'].map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr>{['Thiết kế', 'Người tạo', 'Giá', 'Trạng thái', 'Ngày đăng', 'Thao tác'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center text-neutral-500">Đang tải thiết kế…</td></tr> : items.map((item) => <tr key={item._id} className="border-t border-neutral-100 align-top"><td className="px-4 py-4"><div className="flex items-center gap-3"><img src={item.thumbnailUrl || item.thumbnail || ''} alt="" className="h-14 w-14 rounded-lg bg-neutral-100 object-cover"/><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-neutral-500">{item.category || 'Chưa phân loại'} · {formatVND(item.price)}</p></div></div>{item.moderationHistory?.length ? <details className="mt-2 text-xs text-neutral-500"><summary className="cursor-pointer">Lịch sử kiểm duyệt ({item.moderationHistory.length})</summary><ul className="mt-2 space-y-1">{item.moderationHistory.slice().reverse().map((entry, index) => <li key={`${entry.changedAt}-${index}`}>{entry.status} · {new Date(entry.changedAt).toLocaleString('vi-VN')}{entry.reason ? ` · ${entry.reason}` : ''}</li>)}</ul></details> : null}</td><td className="px-4 py-4">{item.designerId?.displayName || item.userId?.fullName || '—'}<p className="text-xs text-neutral-500">{item.designerId?.username ? `@${item.designerId.username}` : item.userId?.email || ''}</p></td><td className="px-4 py-4">{formatVND(item.price)}</td><td className="px-4 py-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{item.status}</span>{item.rejectionReason && <p className="mt-2 max-w-[220px] text-xs text-red-700">{item.rejectionReason}</p>}</td><td className="px-4 py-4">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2">{item.status === 'PENDING_REVIEW' && <><button disabled={busyId === item._id} onClick={() => void moderate(item, 'PUBLISHED')} className="rounded-lg bg-[#171717] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Duyệt</button><button disabled={busyId === item._id} onClick={() => void moderate(item, 'REJECTED')} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Từ chối</button></>}{item.status === 'PUBLISHED' && <button disabled={busyId === item._id} onClick={() => void moderate(item, 'ARCHIVED')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Ẩn</button>}</div></td></tr>)}{!loading && !items.length && <tr><td colSpan={6} className="p-12 text-center text-neutral-500">Không tìm thấy thiết kế.</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-sm text-neutral-600"><span>{pagination.total.toLocaleString()} thiết kế</span><div className="flex items-center gap-2"><button disabled={pagination.page <= 1 || loading} onClick={() => { setLoading(true); void load(pagination.page - 1) }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><span>Trang {pagination.page} / {Math.max(1, pagination.totalPages)}</span><button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => { setLoading(true); void load(pagination.page + 1) }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div></div></div>
  </section>
}
