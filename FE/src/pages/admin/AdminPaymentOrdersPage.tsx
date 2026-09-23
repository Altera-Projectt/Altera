import { useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

const statuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED']
export function AdminPaymentOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    AdminService.orders({ search, status: status || undefined, limit: 100 })
      .then((response) => setOrders(response.data.data.orders))
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [search, status])
  const updateStatus = async (orderId: string, nextStatus: string) => {
    try { await AdminService.updateOrder(orderId, nextStatus); load() }
    catch (err: any) { setError(err.response?.data?.message || 'Could not update order status.') }
  }
  return <section><h1 className="font-heading text-3xl font-bold">Orders</h1>
    <div className="my-6 flex flex-wrap gap-3"><input aria-label="Search orders" placeholder="Order ID, customer or email" value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-lg border px-3 py-2"/><select aria-label="Filter order status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border px-3 py-2"><option value="">All order statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>
    {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}{loading ? <p>Loading orders…</p> : orders.length === 0 ? <p className="rounded-xl border p-8 text-center">No orders found.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Order ID', 'Customer', 'Email', 'Total', 'Payment', 'Payment Status', 'Transaction ID', 'Order Status', 'Created'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order._id} className="border-t"><td className="p-3">{order._id.slice(-8)}</td><td className="p-3">{order.userId?.fullName || order.shippingAddress?.fullName || '—'}</td><td className="p-3">{order.userId?.email || '—'}</td><td className="p-3">{formatVND(order.totalPrice)}</td><td className="p-3">{order.paymentMethod}</td><td className="p-3">{order.paymentStatus}</td><td className="p-3">{order.transactionId || '—'}</td><td className="p-3"><select aria-label={`Order status ${order._id}`} value={order.status} onChange={(event) => updateStatus(order._id, event.target.value)} className="rounded border p-1">{statuses.map((value) => <option key={value}>{value}</option>)}</select></td><td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
  </section>
}
