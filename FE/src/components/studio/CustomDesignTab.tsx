import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Plus, RotateCw, Trash2, Underline, Upload, X } from 'lucide-react'
import { ProductService } from '@/services/product.api'
import { DesignService, type UploadedCustomImage } from '@/services/design.api'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types/product.types'
import { formatVND } from '@/utils/format'

type TextEffect = 'Straight' | 'Wave' | 'Pinch' | 'Tilt Right' | 'Tilt Left' | 'Curve Up' | 'Flag' | 'Inflate' | 'Curve Down'
type TextLayer = {
  id: string; type: 'text'; text: string; fontFamily: string; fontSize: number; fontWeight: number
  italic: boolean; underline: boolean; textTransform: 'none' | 'uppercase' | 'lowercase'
  align: 'left' | 'center' | 'right'; color: string; stroke: string; strokeWidth: number; opacity: number
  x: number; y: number; rotation: number; scaleX: number; scaleY: number; effect: TextEffect
}
type ImageLayer = { id: string; type: 'image'; src: string; x: number; y: number; rotation: number; scaleX: number; scaleY: number; opacity: number }
type DesignLayer = TextLayer | ImageLayer
type DesignState = { frontDesign: DesignLayer[]; backDesign: DesignLayer[] }
const STORAGE_KEY = 'altera-custom-design-v1'
const FONTS = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Bebas Neue', 'Arial']
const EFFECTS: TextEffect[] = ['Straight', 'Wave', 'Pinch', 'Tilt Right', 'Tilt Left', 'Curve Up', 'Flag', 'Inflate', 'Curve Down']

const makeText = (): TextLayer => ({
  id: crypto.randomUUID(), type: 'text', text: 'Your Text', fontFamily: 'Inter', fontSize: 32, fontWeight: 400,
  italic: false, underline: false, textTransform: 'none', align: 'center', color: '#111111', stroke: '#ffffff',
  strokeWidth: 0, opacity: 1, x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1, effect: 'Straight',
})
const makeImage = (src: string): ImageLayer => ({ id: crypto.randomUUID(), type: 'image', src, x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 })

function readDesign(): DesignState {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value) return JSON.parse(value) as DesignState
  } catch { /* Start with an empty design if saved data is unavailable. */ }
  return { frontDesign: [], backDesign: [] }
}

function readSelection() {
  try { return JSON.parse(localStorage.getItem('altera-custom-selection-v1') ?? '{}') as { productId?: string; colorName?: string; size?: string; printSide?: 'FRONT' | 'BACK' | 'BOTH'; technique?: string; quantity?: number } }
  catch { return {} }
}

function effectStyle(effect: TextEffect): React.CSSProperties {
  return effect === 'Inflate' ? { letterSpacing: '.04em' } : {}
}

function effectTransform(effect: TextEffect): string {
  const transforms: Record<TextEffect, string> = {
    Straight: '', Wave: 'skewY(-8deg) rotate(-2deg)', Pinch: 'scaleX(.78) scaleY(1.12)',
    'Tilt Right': 'rotate(8deg)', 'Tilt Left': 'rotate(-8deg)', 'Curve Up': 'rotate(-5deg) scaleX(.94)',
    Flag: 'skewY(9deg) scaleX(1.06)', Inflate: 'scale(1.12)', 'Curve Down': 'rotate(5deg) scaleX(.94)',
  }
  return transforms[effect]
}

export function CustomDesignTab() {
  const [design, setDesign] = useState<DesignState>(readDesign)
  const [savedSelection] = useState(readSelection)
  const [side, setSide] = useState<'frontDesign' | 'backDesign'>('frontDesign')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [colorName, setColorName] = useState(savedSelection.colorName ?? '')
  const [size, setSize] = useState(savedSelection.size ?? '')
  const [printSide, setPrintSide] = useState<'FRONT' | 'BACK' | 'BOTH'>(savedSelection.printSide ?? 'FRONT')
  const [technique, setTechnique] = useState(savedSelection.technique ?? '')
  const [quantity, setQuantity] = useState(savedSelection.quantity ?? 1)
  const [error, setError] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploads, setUploads] = useState<UploadedCustomImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const fetchCart = useCartStore((state) => state.fetchCart)
  const drag = useRef<{ id: string; x: number; y: number; left: number; top: number } | null>(null)
  const current = design[side]
  const selected = current.find((layer) => layer.id === selectedId) ?? null

  useEffect(() => {
    let active = true
    ProductService.getProducts({ category: 'T-Shirt', limit: 100 }).then(({ data }) => {
      if (!active) return
      const available = data.data.products.filter((item) => item.isActive)
      setProducts(available)
      const initial = available.find((item) => item._id === savedSelection.productId) ?? available[0] ?? null
      setProduct(initial)
      if (initial) {
        setColorName(initial.colors?.some((item) => item.name === savedSelection.colorName) ? savedSelection.colorName! : initial.colors?.[0]?.name ?? '')
        setSize(initial.sizes?.some((item) => item.label === savedSelection.size && item.stock > 0) ? savedSelection.size! : initial.sizes?.find((item) => item.stock > 0)?.label ?? '')
        setTechnique(initial.printingTechniques?.some((item) => item.code === savedSelection.technique) ? savedSelection.technique! : initial.printingTechniques?.[0]?.code ?? '')
        setQuantity(Math.max(1, savedSelection.quantity ?? 1))
      }
    }).catch(() => { if (active) setError('Unable to load products. Please try again.') }).finally(() => { if (active) setLoadingProducts(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    DesignService.getCustomImages().then(({ data }) => setUploads(data.data.images)).catch(() => setError('Unable to load uploaded images.'))
  }, [])

  const colors = product?.colors ?? []
  const sizes = product?.sizes ?? []
  const selectedColor = colors.find((color) => color.name === colorName) ?? null
  const productPreview = selectedColor?.imageUrl ?? product?.imageUrl ?? product?.images?.[0]
  const selectedSize = sizes.find((option) => option.label === size) ?? null
  const stock = product ? Math.min(product.stock, selectedColor?.stock ?? product.stock, selectedSize?.stock ?? product.stock) : 0
  const techniques = product?.printingTechniques ?? []
  const selectedTechnique = techniques.find((item) => item.code === technique) ?? null
  const estimatedPrice = useMemo(() => {
    if (!product || !selectedTechnique) return 0
    return (product.discountPrice ?? product.price) + selectedTechnique.price + (printSide === 'BOTH' ? selectedTechnique.additionalSidePrice : 0)
  }, [product, selectedTechnique, printSide])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)) }, [design])
  useEffect(() => { if (product?._id) localStorage.setItem('altera-custom-selection-v1', JSON.stringify({ productId: product._id, colorName, size, printSide, technique, quantity })) }, [product?._id, colorName, size, printSide, technique, quantity])
  const update = (id: string, patch: Partial<TextLayer> | Partial<ImageLayer>) => setDesign((prev) => ({ ...prev, [side]: prev[side].map((layer) => layer.id === id ? { ...layer, ...patch } as DesignLayer : layer) }))
  const addText = () => { const layer = makeText(); setDesign((prev) => ({ ...prev, [side]: [...prev[side], layer] })); setSelectedId(layer.id) }
  const uploadFile = async (file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image size exceeds the 10MB limit.'); return }
    const extension = file.name.split('.').pop()?.toLowerCase()
    const valid = (extension === 'png' && file.type === 'image/png') || (['jpg', 'jpeg'].includes(extension ?? '') && file.type === 'image/jpeg') || (extension === 'webp' && file.type === 'image/webp')
    if (!valid) { setError('Choose a valid PNG, JPG, JPEG, or WEBP image.'); return }
    setUploading(true)
    try {
      const { data } = await DesignService.uploadCustomImage(file)
      setUploads((currentUploads) => [data.data.image, ...currentUploads])
      setError('')
    } catch (uploadError: any) { setError(uploadError?.response?.data?.message ?? 'Could not upload this image.') }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = '' }
  }
  const addUploadedImage = (image: UploadedCustomImage) => { const layer = makeImage(image.url); setDesign((prev) => ({ ...prev, [side]: [...prev[side], layer] })); setSelectedId(layer.id); setError('') }
  const deleteUploadedImage = async (image: UploadedCustomImage) => {
    const inUse = [...design.frontDesign, ...design.backDesign].some((layer) => layer.type === 'image' && layer.src === image.url)
    if (inUse && !window.confirm('This image is being used in your design. Delete anyway?')) return
    try { await DesignService.deleteCustomImage(image._id, inUse); setUploads((items) => items.filter((item) => item._id !== image._id)); setError('') }
    catch (deleteError: any) { setError(deleteError?.response?.data?.message ?? 'Could not delete this image.') }
  }
  const removeText = () => { if (!selectedId) return; setDesign((prev) => ({ ...prev, [side]: prev[side].filter((layer) => layer.id !== selectedId) })); setSelectedId(null) }
  const changeSide = (next: 'frontDesign' | 'backDesign') => { setSide(next); setSelectedId(null) }
  const selectProduct = (next: Product | null) => {
    setProduct(next)
    setColorName(next?.colors?.find((item) => item.stock > 0)?.name ?? '')
    setSize(next?.sizes?.find((item) => item.stock > 0)?.label ?? '')
    setTechnique(next?.printingTechniques?.[0]?.code ?? '')
    setQuantity(1)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    update(drag.current.id, { x: Math.min(100, Math.max(0, drag.current.left + (event.clientX - drag.current.x) / bounds.width * 100)), y: Math.min(100, Math.max(0, drag.current.top + (event.clientY - drag.current.y) / bounds.height * 100)) })
  }

  const addToOrder = async (orderNow: boolean) => {
    if (!product || !colorName || !size || !printSide || !selectedTechnique) {
      setError('Choose a product, color, size, print side, and printing technique.')
      return
    }
    const hasFront = design.frontDesign.length > 0
    const hasBack = design.backDesign.length > 0
    if ((printSide === 'FRONT' && !hasFront) || (printSide === 'BACK' && !hasBack) || (printSide === 'BOTH' && (!hasFront || !hasBack))) {
      setError('Add a design layer to every selected print side before ordering.')
      return
    }
    if (quantity < 1 || quantity > stock) {
      setError(quantity > stock ? `Only ${stock} items are in stock for this selection.` : 'Quantity must be at least 1.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await CartService.addToCart({ productId: product._id, quantity, customization: {
        color: { name: selectedColor?.name ?? colorName, hex: selectedColor?.hex ?? '#ffffff' }, size, printSide,
        printingTechnique: selectedTechnique.code,
        frontDesign: { layers: design.frontDesign, background: null },
        backDesign: { layers: design.backDesign, background: null },
      } })
      await fetchCart()
      if (orderNow) navigate('/checkout')
      else setError('Added to cart successfully.')
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? 'Could not add this design to cart.')
    } finally { setSubmitting(false) }
  }

  return <div className="grid gap-6 lg:grid-cols-[290px_minmax(300px,1fr)_300px]">
    <aside className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Product</h2>
      {loadingProducts ? <p className="text-sm text-gray-500">Loading products…</p> : products.length === 0 ? <p className="text-sm text-gray-500">No active T-shirt products are available.</p> : <select aria-label="Product" value={product?._id ?? ''} onChange={(e) => selectProduct(products.find((item) => item._id === e.target.value) ?? null)} className="w-full rounded border p-2 text-sm">{products.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>}
      {product && <>
        <p className="text-sm font-semibold">{formatVND(product.discountPrice ?? product.price)} <span className="font-normal text-gray-500">· Stock {stock}</span></p>
        <div><p className="mb-2 text-xs font-medium">Color</p><div className="flex flex-wrap gap-2">{colors.map((item) => <button key={item.name} title={item.stock <= 0 ? `${item.name} · Out of Stock` : item.name} aria-label={item.name} disabled={item.stock <= 0} onClick={() => setColorName(item.name)} className={`h-8 w-8 rounded-full border-2 disabled:cursor-not-allowed disabled:opacity-30 ${colorName === item.name ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'}`} style={{ backgroundColor: item.hex }} />)}{colors.length === 0 && <span className="text-xs text-gray-500">No colors configured</span>}</div>{selectedColor && <p className="mt-1 text-xs text-gray-500">{selectedColor.name} · {selectedColor.stock} in stock</p>}</div>
        <label className="block text-sm">Size<select aria-label="Size" className="mt-1 w-full rounded border p-2" value={size} onChange={(e) => setSize(e.target.value)}><option value="">Select size</option>{sizes.map((option) => <option key={option.label} value={option.label} disabled={option.stock <= 0}>{option.label}{option.stock <= 0 ? ' · Out of Stock' : ` · ${option.stock} left`}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Print side</p><div className="grid grid-cols-3 gap-1">{([['FRONT', 'Front'], ['BACK', 'Back'], ['BOTH', 'Both Sides']] as const).map(([value, label]) => <button key={value} onClick={() => setPrintSide(value)} className={`rounded border px-1 py-2 text-xs ${printSide === value ? 'bg-black text-white' : ''}`}>{label}</button>)}</div></div>
        <label className="block text-sm">Printing technique<select className="mt-1 w-full rounded border p-2" value={technique} onChange={(e) => setTechnique(e.target.value)}><option value="">Select technique</option>{techniques.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Quantity</p><div className="flex items-center gap-3"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded border px-3 py-1 disabled:opacity-40">−</button><span>{quantity}</span><button aria-label="Increase quantity" disabled={quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))} className="rounded border px-3 py-1 disabled:opacity-40">+</button><span className="text-xs text-gray-500">Max {stock}</span></div></div>
        <div className="border-t pt-3"><p className="flex justify-between text-sm"><span>Estimated total</span><strong>{formatVND(estimatedPrice * quantity)}</strong></p><p className="mt-1 text-xs text-gray-500">Product {formatVND(product.discountPrice ?? product.price)} + print {formatVND(selectedTechnique?.price ?? 0)}{printSide === 'BOTH' ? ` + second side ${formatVND(selectedTechnique?.additionalSidePrice ?? 0)}` : ''}{selectedTechnique?.customizationPrice ? ` + customization ${formatVND(selectedTechnique.customizationPrice)}` : ''}</p>{quantity > stock && <p className="mt-1 text-xs text-red-600">Quantity exceeds available stock.</p>}</div>
      </>}
      <button onClick={addText} className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white"><Plus size={16}/>Add Text</button>
      <div onDragOver={(event) => { event.preventDefault(); setDragOver(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false) }} onDrop={(event) => { event.preventDefault(); setDragOver(false); void uploadFile(event.dataTransfer.files[0]) }} className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${dragOver ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
        <Upload className="mx-auto mb-2" size={20}/><p className="text-sm font-semibold">Drag and drop or click to upload</p><p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, WEBP · Maximum 10MB</p>
        <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-3 rounded border px-3 py-2 text-sm disabled:opacity-50">{uploading ? 'Uploading…' : 'Choose file'}</button>
        <input ref={fileInput} className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => void uploadFile(event.target.files?.[0])}/>
      </div>
      <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Uploaded images</p>
        {uploads.length === 0 ? <p className="text-xs text-gray-500">Your uploaded images will appear here.</p> : <div className="grid grid-cols-3 gap-2">{uploads.map((image) => <div key={image._id} className="group relative min-w-0 rounded border p-1">
          <button type="button" onClick={() => addUploadedImage(image)} title={`Add ${image.filename} to ${side === 'frontDesign' ? 'front' : 'back'}`} className="block w-full text-left"><img src={image.thumbnailUrl || image.url} alt={image.filename} loading="lazy" className="aspect-square w-full rounded object-cover"/><span className="mt-1 block truncate text-[10px]">{image.filename}</span><span className="block text-[10px] text-gray-500">{(image.size / (1024 * 1024)).toFixed(2)} MB</span></button>
          <button type="button" onClick={() => void deleteUploadedImage(image)} aria-label={`Delete ${image.filename}`} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow"><X size={13}/></button>
        </div>)}</div>}
      </div>
      <div className="flex gap-2"><button onClick={() => changeSide('frontDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'frontDesign' ? 'bg-black text-white' : ''}`}>Front</button><button onClick={() => changeSide('backDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'backDesign' ? 'bg-black text-white' : ''}`}>Back</button></div>
      <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Layers · {side === 'frontDesign' ? 'Front' : 'Back'}</p>
        {current.length === 0 && <p className="text-sm text-gray-500">No text layers yet.</p>}
        {current.map((layer, index) => <button key={layer.id} onClick={() => setSelectedId(layer.id)} className={`w-full truncate rounded border px-3 py-2 text-left text-sm ${selectedId === layer.id ? 'border-black bg-gray-50' : ''}`}>{layer.type === 'text' ? `T${index + 1} · ${layer.text || 'Text'}` : `Image ${index + 1}`}</button>)}
      </div>
    </aside>
    <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-gray-200 bg-gray-100 p-8">
      <div className="relative aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-gray-300 shadow-xl" style={{ backgroundColor: selectedColor?.hex ?? '#ffffff' }} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }}>
        {productPreview ? <img src={productPreview} alt={`${product?.name ?? 'T-shirt'} ${selectedColor?.name ?? ''} preview`} className="absolute inset-0 h-full w-full object-contain mix-blend-multiply" /> : <svg aria-label={`${product?.name ?? 'T-shirt'} preview`} className="absolute inset-0 h-full w-full" viewBox="0 0 360 480" role="img"><path d="M112 45 145 30h70l33 15 67 43-39 67-38-22v288H122V133l-38 22-39-67z" fill={selectedColor?.hex ?? '#fff'} stroke="rgba(0,0,0,.15)" strokeWidth="3"/><path d="M145 30c2 32 17 49 35 49s33-17 35-49" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="3"/></svg>}
        <div className="absolute right-2 top-2 rounded bg-white/80 px-2 py-1 text-[10px] font-semibold">{side === 'frontDesign' ? 'FRONT' : 'BACK'}</div>
        <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 rounded-b-full border-b border-gray-200" />
        {current.map((layer) => <div key={layer.id} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(layer.id); drag.current = { id: layer.id, x: event.clientX, y: event.clientY, left: layer.x, top: layer.y } }} onClick={() => setSelectedId(layer.id)} className={`absolute cursor-move ${selectedId === layer.id ? 'outline outline-1 outline-blue-500 outline-dashed' : ''}`} style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scaleX}, ${layer.scaleY}) ${layer.type === 'text' ? effectTransform(layer.effect) : ''}`, transformOrigin: 'center', opacity: layer.opacity, touchAction: 'none', ...(layer.type === 'text' ? { maxWidth: '90%', whiteSpace: 'pre-wrap' as const, overflowWrap: 'break-word' as const, paddingLeft: '0.5rem', paddingRight: '0.5rem', fontFamily: `"${layer.fontFamily}", sans-serif`, fontSize: `${layer.fontSize}px`, fontWeight: layer.fontWeight, fontStyle: layer.italic ? 'italic' : 'normal', textDecoration: layer.underline ? 'underline' : 'none', textTransform: layer.textTransform, textAlign: layer.align, color: layer.color, WebkitTextStroke: `${layer.strokeWidth}px ${layer.stroke}`, ...effectStyle(layer.effect) } : { width: '140px', height: '140px' }) }}>{layer.type === 'text' ? layer.text || ' ' : <img src={layer.src} alt="Custom design layer" draggable="false" className="h-full w-full object-contain"/>}</div>)}
      </div>
    </div>
    <aside className="max-h-[720px] space-y-4 overflow-auto rounded-xl border border-[var(--color-border)] bg-white p-4">
      {selected?.type === 'text' ? <>
        <label className="block text-sm font-medium">Enter text...<textarea maxLength={500} rows={4} value={selected.text} onChange={(e) => update(selected.id, { text: e.target.value })} className="mt-1 w-full rounded border p-2"/><span className="text-xs text-gray-500">{selected.text.length}/500</span></label>
        <label className="block text-sm">Font<select className="mt-1 w-full rounded border p-2" value={selected.fontFamily} onChange={(e) => update(selected.id, { fontFamily: e.target.value })}>{FONTS.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label className="block text-sm">Size · {selected.fontSize}px<input className="w-full" type="range" min="8" max="200" value={selected.fontSize} onChange={(e) => update(selected.id, { fontSize: Number(e.target.value) })}/></label>
        <div className="flex gap-2">{[[Bold, 'bold'], [Italic, 'italic'], [Underline, 'underline']].map(([Icon, key]) => <button key={key as string} title={key as string} onClick={() => update(selected.id, key === 'bold' ? { fontWeight: selected.fontWeight === 700 ? 400 : 700 } : key === 'italic' ? { italic: !selected.italic } : { underline: !selected.underline })} className="rounded border p-2"><Icon size={16}/></button>)}<button title="Uppercase" className="rounded border px-2 text-xs" onClick={() => update(selected.id, { textTransform: selected.textTransform === 'uppercase' ? 'none' : 'uppercase' })}>AA</button><button title="Lowercase" className="rounded border px-2 text-xs" onClick={() => update(selected.id, { textTransform: selected.textTransform === 'lowercase' ? 'none' : 'lowercase' })}>aa</button></div>
        <div className="flex gap-2">{[[AlignLeft, 'left'], [AlignCenter, 'center'], [AlignRight, 'right']].map(([Icon, align]) => <button key={align as string} onClick={() => update(selected.id, { align: align as TextLayer['align'] })} className={`rounded border p-2 ${selected.align === align ? 'bg-gray-100' : ''}`}><Icon size={16}/></button>)}</div>
        <div className="grid grid-cols-2 gap-3">{([['Text color', 'color'], ['Stroke color', 'stroke']] as const).map(([label, key]) => <label key={key} className="text-sm">{label}<input className="mt-1 h-10 w-full" type="color" value={selected[key]} onChange={(e) => update(selected.id, { [key]: e.target.value })}/></label>)}</div>
        <label className="block text-sm">Stroke width · {selected.strokeWidth}px<input className="w-full" type="range" min="0" max="12" value={selected.strokeWidth} onChange={(e) => update(selected.id, { strokeWidth: Number(e.target.value) })}/></label>
        <label className="block text-sm">Opacity · {Math.round(selected.opacity * 100)}%<input className="w-full" type="range" min="0" max="1" step="0.01" value={selected.opacity} onChange={(e) => update(selected.id, { opacity: Number(e.target.value) })}/></label>
        <label className="block text-sm">Effect<select className="mt-1 w-full rounded border p-2" value={selected.effect} onChange={(e) => update(selected.id, { effect: e.target.value as TextEffect })}>{EFFECTS.map((effect) => <option key={effect}>{effect}</option>)}</select></label>
        <label className="block text-sm">Rotate · {selected.rotation}°<input className="w-full" type="range" min="-180" max="180" value={selected.rotation} onChange={(e) => update(selected.id, { rotation: Number(e.target.value) })}/></label>
        <label className="block text-sm">Resize · {selected.scaleX.toFixed(1)}×<input className="w-full" type="range" min="0.3" max="3" step="0.1" value={selected.scaleX} onChange={(e) => update(selected.id, { scaleX: Number(e.target.value), scaleY: Number(e.target.value) })}/></label>
      </> : selected?.type === 'image' ? <>
        <p className="text-sm font-medium">Image layer</p>
        <label className="block text-sm">Opacity · {Math.round(selected.opacity * 100)}%<input className="w-full" type="range" min="0" max="1" step="0.01" value={selected.opacity} onChange={(e) => update(selected.id, { opacity: Number(e.target.value) })}/></label>
        <label className="block text-sm">Rotate · {selected.rotation}°<input className="w-full" type="range" min="-180" max="180" value={selected.rotation} onChange={(e) => update(selected.id, { rotation: Number(e.target.value) })}/></label>
        <label className="block text-sm">Resize · {selected.scaleX.toFixed(1)}×<input className="w-full" type="range" min="0.3" max="3" step="0.1" value={selected.scaleX} onChange={(e) => update(selected.id, { scaleX: Number(e.target.value), scaleY: Number(e.target.value) })}/></label>
      </> : <p className="text-sm text-gray-500">Select a layer or add text/image to edit its properties.</p>}
      {selected && <button onClick={removeText} className="flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600"><Trash2 size={16}/>Delete layer</button>}
      <div className="flex items-center gap-2 border-t pt-3 text-xs text-gray-500"><RotateCw size={14}/>Drag on canvas to move · use controls to resize and rotate</div>
      {error && <p role="status" className={`text-sm ${error.startsWith('Added') ? 'text-green-700' : 'text-red-600'}`}>{error}</p>}
      <button disabled={submitting || loadingProducts || !product} onClick={() => void addToOrder(false)} className="w-full rounded-lg border border-black px-4 py-3 text-sm font-semibold disabled:opacity-50">{submitting ? 'Adding…' : 'Add to Cart'}</button>
      <button disabled={submitting || loadingProducts || !product} onClick={() => void addToOrder(true)} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Order Now</button>
    </aside>
  </div>
}
