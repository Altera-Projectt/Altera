export interface OrderItem {
  productId: string
  quantity: number
}

export interface ShippingAddress {
  fullName?: string
  phone?: string
  address?: string
  street?: string
  city: string
  country?: string
}

export type PaymentMethod = 'COD' | 'BANK_TRANSFER'

export interface CreateOrderPayload {
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod?: PaymentMethod
}

export interface Order {
  _id: string
  // Cho phép backend mở rộng sau này
  [key: string]: any
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
