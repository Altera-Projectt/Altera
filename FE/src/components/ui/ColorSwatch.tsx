import { getColorHex, getContrastText } from '@/utils/colorMap'

interface ColorSwatchProps {
  /** Danh sách tên màu (tiếng Việt hoặc Anh) */
  colors: string[]
  /** 'avoid' hiện dấu ✕ và gạch ngang tên màu */
  variant?: 'default' | 'avoid'
  size?: 'sm' | 'md'
}

export function ColorSwatch({ colors, variant = 'default', size = 'md' }: ColorSwatchProps) {
  if (!colors || colors.length === 0) return null

  const dotSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((colorName) => {
        const hex = getColorHex(colorName)
        const isLight = hex === '#FFFFFF' || hex === '#FFFDD0' || hex === '#FEF08A'

        return (
          <div key={colorName} className="flex items-center gap-1.5">
            {/* Ô màu tròn */}
            <div
              className={`${dotSize} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border`}
              style={{
                backgroundColor: hex || '#E5E7EB',
                borderColor: isLight ? '#D1D5DB' : (hex ? 'transparent' : '#E5E7EB'),
              }}
              title={colorName}
            >
              {variant === 'avoid' && hex && (
                <span
                  className="font-bold leading-none"
                  style={{
                    color: getContrastText(hex),
                    fontSize: size === 'sm' ? '8px' : '10px',
                  }}
                >
                  ✕
                </span>
              )}
              {!hex && (
                <span className="text-[8px] text-gray-400 leading-none">?</span>
              )}
            </div>

            {/* Tên màu */}
            <span
              className={`text-xs capitalize leading-none ${
                variant === 'avoid'
                  ? 'text-[var(--color-error)] line-through opacity-80'
                  : 'text-[var(--color-foreground)]'
              }`}
            >
              {colorName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
