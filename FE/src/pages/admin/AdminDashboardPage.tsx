import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

const labels: Record<string, string> = { totalCustomers: 'Customers', totalUsers: 'Active users', totalOrders: 'Orders', totalProducts: 'Active products', pendingOrders: 'Pending orders', completedOrders: 'Completed orders', revenue: 'Revenue' }
export function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { AdminService.dashboard().then((r) => setStats(r.data.data)).catch((e) => setError(e.response?.data?.message || 'Could not load dashboard data.')) }, [])
  return <section><h1 className="font-heading text-3xl font-bold">Dashboard</h1><p className="mt-2 text-[var(--color-muted-foreground)]">Store overview from current orders and catalog.</p>
    {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
    {!stats && !error && <p className="mt-8">Loading statistics…</p>}
    {stats && <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(labels).map(([key, label]) => <article key={key} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"><p className="text-sm text-[var(--color-muted-foreground)]">{label}</p><p className="mt-3 text-2xl font-bold">{key === 'revenue' ? formatVND(stats[key]) : stats[key]?.toLocaleString() ?? 0}</p></article>)}</div>}
  </section>
}
