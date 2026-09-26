import api from '@/utils/axios'

export const AdminService = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  user: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  customers: (params?: Record<string, unknown>) => api.get('/admin/customers', { params }),
  orders: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  order: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrder: (id: string, status: string) => api.patch(`/admin/orders/${id}/status`, { status }),
  payments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
  confirmPayment: (orderId: string, transactionId?: string) => api.patch(`/admin/payments/${orderId}/confirm`, { transactionId }),
  rejectPayment: (orderId: string, reason?: string) => api.patch(`/admin/payments/${orderId}/reject`, { reason }),
  products: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  createProduct: (data: FormData | Record<string, unknown>) => api.post('/admin/products', data),
  updateProduct: (id: string, data: FormData | Record<string, unknown>) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  templates: () => api.get('/admin/templates'),
  createTemplate: (data: Record<string, unknown>) => api.post('/admin/templates', data),
  updateTemplate: (id: string, data: Record<string, unknown>) => api.put(`/admin/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/admin/templates/${id}`),
}
