export interface CartItemProduct {
  _id: string
  id: string
  name: string
  imageUrl: string
  price: number
  stock: number
}

export interface CartItem {
  _id?: string
  id?: string
  productId: CartItemProduct
  quantity: number
  price: number
  customization?: ProductCustomization
}

export interface ProductCustomization {
  color: { name: string; hex: string }
  size: string
  printSide: 'FRONT' | 'BACK' | 'BOTH'
  printingTechnique: string
  frontDesign: { layers: unknown[]; background: string | null }
  backDesign: { layers: unknown[]; background: string | null }
  estimatedPrice?: number
}

export interface Cart {
  items: CartItem[]
  totalPrice: number
  totalItems: number
}

export interface CartResponse {
  cart: Cart
}

export interface AddCartPayload {
  productId: string
  quantity: number
  customization?: ProductCustomization
}

export interface UpdateCartPayload {
  quantity: number
}
