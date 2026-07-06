/**
 * ALTERA — Color Map Utility
 * Maps Vietnamese and English color names to hex values.
 */

export const COLOR_MAP: Record<string, string> = {
  // Tiếng Việt
  'trắng': '#FFFFFF',
  'đen': '#111111',
  'xám': '#9CA3AF',
  'xám nhạt': '#D1D5DB',
  'xám đậm': '#4B5563',
  'đỏ': '#EF4444',
  'đỏ đô': '#991B1B',
  'cam': '#F97316',
  'vàng': '#EAB308',
  'vàng nhạt': '#FEF08A',
  'vàng neon': '#CCFF00',
  'vàng đồng': '#B8860B',
  'xanh lá': '#22C55E',
  'xanh lá đậm': '#15803D',
  'xanh dương': '#3B82F6',
  'xanh navy': '#1E3A5F',
  'xanh nhạt': '#BAE6FD',
  'xanh pastel': '#BFDBFE',
  'xanh mint': '#98FF98',
  'xanh ngọc': '#14B8A6',
  'xanh olive': '#6B7B2A',
  'xanh rêu': '#4D7C0F',
  'tím': '#A855F7',
  'tím nhạt': '#DDD6FE',
  'tím lavender': '#C4B5FD',
  'hồng': '#EC4899',
  'hồng cánh sen': '#F9A8D4',
  'hồng pastel': '#FBCFE8',
  'hồng nude': '#E8C4A0',
  'nâu': '#92400E',
  'nâu đất': '#78350F',
  'be': '#D4B896',
  'kem': '#FFFDD0',
  'bạc': '#C0C0C0',
  'rêu': '#4D7C0F',
  'neon': '#CCFF00',
  'olive': '#6B7B2A',
  'coral': '#FF6B6B',
  'mint': '#98FF98',
  // Tiếng Anh
  'white': '#FFFFFF',
  'black': '#111111',
  'gray': '#9CA3AF',
  'grey': '#9CA3AF',
  'light gray': '#D1D5DB',
  'dark gray': '#4B5563',
  'red': '#EF4444',
  'dark red': '#991B1B',
  'burgundy': '#800020',
  'maroon': '#7F1D1D',
  'orange': '#F97316',
  'yellow': '#EAB308',
  'neon yellow': '#CCFF00',
  'green': '#22C55E',
  'dark green': '#15803D',
  'blue': '#3B82F6',
  'navy': '#1E3A5F',
  'baby blue': '#BAE6FD',
  'sky blue': '#7DD3FC',
  'teal': '#14B8A6',
  'turquoise': '#06B6D4',
  'purple': '#A855F7',
  'lavender': '#C4B5FD',
  'pink': '#EC4899',
  'rose': '#FB7185',
  'nude': '#E8C4A0',
  'brown': '#92400E',
  'caramel': '#C68642',
  'beige': '#D4B896',
  'cream': '#FFFDD0',
  'silver': '#C0C0C0',
  'gold': '#B8860B',
  'rust': '#B45309',
  'khaki': '#C3B091',
}

/**
 * Lấy mã hex từ tên màu (tiếng Việt hoặc Anh).
 * Hỗ trợ partial match nếu không tìm thấy exact match.
 */
export const getColorHex = (colorName: string): string | null => {
  if (!colorName) return null
  const key = colorName.toLowerCase().trim()
  if (COLOR_MAP[key]) return COLOR_MAP[key]
  // Partial match fallback
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return null
}

/**
 * Tính màu text tương phản (đen hoặc trắng) dựa trên độ sáng của màu nền.
 */
export const getContrastText = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#111111' : '#FFFFFF'
}
