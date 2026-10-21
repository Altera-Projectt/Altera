import { useState } from 'react'
import { cn } from '@/utils/cn'
import { optimizeCloudinaryUrl } from '@/utils/format'
import type { CartItem } from '@/types/cart.types'

export interface ResolvedCartItemMeta {
  displayName: string
  subtitle: string | null
  imageUrl: string | null
  artworkUrl: string | null
  hexColor: string
  colorName: string
  isMarketplaceDesign: boolean
}

export function resolveCartItemVisual(item: Partial<CartItem> | any): ResolvedCartItemMeta {
  const marketplace =
    typeof item?.marketplaceDesignId === 'object' && item.marketplaceDesignId !== null
      ? item.marketplaceDesignId
      : null

  const designSnapshot = item?.designSnapshot || null

  const frontLayerImg = item?.customization?.frontDesign?.layers?.find?.(
    (l: any) => l && l.type === 'image' && l.src
  )?.src
  const backLayerImg = item?.customization?.backDesign?.layers?.find?.(
    (l: any) => l && l.type === 'image' && l.src
  )?.src
  const artworkUrl = frontLayerImg || backLayerImg || null

  const directImg =
    item?.imageUrl ||
    (typeof item?.productId === 'object' ? item.productId?.imageUrl : null) ||
    null

  const marketplaceThumbnail = marketplace?.thumbnail || designSnapshot?.thumbnail || null

  const primaryImg = marketplaceThumbnail || directImg || null

  const displayName =
    marketplace?.name ||
    designSnapshot?.name ||
    item?.name ||
    (typeof item?.productId === 'object' ? item.productId?.name : null) ||
    'Sản phẩm thiết kế'

  const rawProductName = typeof item?.productId === 'object' ? item.productId?.name : null
  const subtitle =
    (marketplace?.name || designSnapshot?.name) && rawProductName && rawProductName !== displayName
      ? `Phôi: ${rawProductName}`
      : null

  const hexColor =
    item?.customization?.color?.hex ||
    item?.color?.hex ||
    '#F5F5F5'

  const colorName =
    item?.customization?.color?.name ||
    item?.color?.name ||
    ''

  return {
    displayName,
    subtitle,
    imageUrl: primaryImg,
    artworkUrl,
    hexColor,
    colorName,
    isMarketplaceDesign: Boolean(marketplace || designSnapshot),
  }
}

export function GarmentVectorThumbnail({
  hexColor = '#F5F5F5',
  artworkUrl,
  className = '',
}: {
  hexColor?: string
  artworkUrl?: string | null
  className?: string
}) {
  const isLight = !hexColor || ['#ffffff', '#f5f5f5', '#fffdd0', '#fff', '#f8fafc'].includes(hexColor.toLowerCase())
  const fabricColor = hexColor || '#F5F5F5'
  const gradId = `shirt_${fabricColor.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0A1122]',
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full p-1.5 drop-shadow-md select-none pointer-events-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${gradId}_base`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fabricColor} stopOpacity="1" />
            <stop offset="100%" stopColor={fabricColor} stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id={`${gradId}_crease`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isLight ? 0.35 : 0.15} />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity={isLight ? 0.25 : 0.45} />
          </linearGradient>
        </defs>

        {/* T-shirt main body & sleeves */}
        <path
          d="M 37 20 C 42 24 58 24 63 20 L 85 28 L 76 42 L 69 39 L 69 82 C 69 84 67 85 65 85 L 35 85 C 33 85 31 84 31 82 L 31 39 L 24 42 L 15 28 Z"
          fill={`url(#${gradId}_base)`}
          stroke={isLight ? '#94a3b8' : '#334155'}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Crease shading */}
        <path
          d="M 37 20 C 42 24 58 24 63 20 L 85 28 L 76 42 L 69 39 L 69 82 C 69 84 67 85 65 85 L 35 85 C 33 85 31 84 31 82 L 31 39 L 24 42 L 15 28 Z"
          fill={`url(#${gradId}_crease)`}
        />

        {/* Collar neckline */}
        <path
          d="M 37 20 C 42 25 58 25 63 20"
          fill="none"
          stroke={isLight ? '#64748b' : '#1e293b'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 37 20 C 43 17 57 17 63 20 C 58 23 42 23 37 20 Z"
          fill="#060B16"
          opacity="0.8"
        />
      </svg>

      {/* If custom artwork exists on top of the blank shirt, place it on the chest area */}
      {artworkUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
          <img
            src={optimizeCloudinaryUrl(artworkUrl, 160)}
            alt=""
            className="max-h-[42%] max-w-[42%] object-contain drop-shadow"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
    </div>
  )
}

export interface CartItemThumbnailProps {
  item: Partial<CartItem> | any
  className?: string
  imgClassName?: string
  width?: number
}

export function CartItemThumbnail({
  item,
  className = '',
  imgClassName = '',
  width = 200,
}: CartItemThumbnailProps) {
  const [loadError, setLoadError] = useState(false)
  const meta = resolveCartItemVisual(item)

  const effectiveImg = !loadError && (meta.imageUrl || (!meta.isMarketplaceDesign && meta.artworkUrl ? null : meta.imageUrl))

  // If we have a full rendered thumbnail (e.g. marketplace 3D preview or product photo)
  if (effectiveImg) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-[#0A1122]', className)}>
        <img
          src={optimizeCloudinaryUrl(effectiveImg, width)}
          alt={meta.displayName}
          loading="lazy"
          decoding="async"
          onError={() => setLoadError(true)}
          className={cn(
            'h-full w-full object-cover transition-transform duration-500 hover:scale-105',
            imgClassName
          )}
        />
      </div>
    )
  }

  // If it's a custom design with artwork or a blank shirt, render high-fidelity garment vector with artwork
  return (
    <GarmentVectorThumbnail
      hexColor={meta.hexColor}
      artworkUrl={meta.artworkUrl}
      className={className}
    />
  )
}
