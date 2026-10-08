import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Lock, RotateCw, Trash2, Unlock, Upload, X, Save, FolderOpen, Search } from 'lucide-react'
import { ProductService } from '@/services/product.api'
import { DesignService, type CustomDesignDraft, type DesignTemplate, type UploadedCustomImage } from '@/services/design.api'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types/product.types'
import { formatVND } from '@/utils/format'
import ShirtCanvas3D from './ShirtCanvas3D'
type ImageLayer = { id: string; type: 'image'; name: string; visible: boolean; locked: boolean; zIndex: number; src: string; x: number; y: number; rotation: number; scaleX: number; scaleY: number; opacity: number }
type DesignLayer = ImageLayer
type DesignState = { frontDesign: { layers: DesignLayer[] }; backDesign: { layers: DesignLayer[] } }
const isAIAsset = (image: UploadedCustomImage) => image.imageType === 'AI' || image.source === 'AI'

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
function makeDraftThumbnail(color: string, layers: DesignLayer[]) {
  const items = layers.filter((layer) => layer.visible).map((layer) => {
    const transform = `translate(${layer.x * 2.4} ${layer.y * 3.2}) rotate(${layer.rotation}) scale(${layer.scaleX} ${layer.scaleY})`
    return `<image href="${escapeXml(layer.src)}" x="-28" y="-28" width="56" height="56" opacity="${layer.opacity}" preserveAspectRatio="xMidYMid meet" transform="${transform}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><path d="M72 38 96 28h48l24 10 48 32-27 48-27-16v190H78V102l-27 16-27-48z" fill="${escapeXml(color)}" stroke="#d1d5db" stroke-width="3"/>${items}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}


const makeImage = (src: string): ImageLayer => ({ id: crypto.randomUUID(), type: 'image', name: 'Image', visible: true, locked: false, zIndex: Date.now(), src, x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 })

function readDesign(storageKey: string): DesignState {
  try {
    const value = localStorage.getItem(storageKey) ?? (storageKey.endsWith('-guest') ? localStorage.getItem('altera-custom-design-v1') : null)
    if (value) {
      const parsed = JSON.parse(value) as DesignState
      const normalize = (value: DesignLayer[] | { layers?: DesignLayer[] } | undefined) => (Array.isArray(value) ? value : value?.layers ?? []).map((layer, index) => ({
        ...layer, 
        id: layer.id || crypto.randomUUID(),
        name: (layer as DesignLayer & { name?: string }).name || `Image ${index + 1}`,
        visible: (layer as DesignLayer & { visible?: boolean }).visible ?? true,
        locked: (layer as DesignLayer & { locked?: boolean }).locked ?? false,
        zIndex: (layer as DesignLayer & { zIndex?: number }).zIndex ?? index,
      })).filter(layer => layer.type === 'image' && (layer as ImageLayer).src && !(layer as ImageLayer).src.startsWith('data:')) as DesignLayer[]
      return { frontDesign: { layers: normalize(parsed.frontDesign as unknown as DesignLayer[] | { layers?: DesignLayer[] }) }, backDesign: { layers: normalize(parsed.backDesign as unknown as DesignLayer[] | { layers?: DesignLayer[] }) } }
    }
  } catch { /* Start with an empty design if saved data is unavailable. */ }
  return { frontDesign: { layers: [] }, backDesign: { layers: [] } }
}

const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
  }
  return fallback
}

function readSelection() {
  try { return JSON.parse(localStorage.getItem('altera-custom-selection-v1') ?? '{}') as { productId?: string; colorName?: string; size?: string; printSide?: 'FRONT' | 'BACK' | 'BOTH'; technique?: string; quantity?: number } }
  catch { return {} }
}



type CustomDesignTabProps = {
  /** Image handed over from another tab (e.g. an AI result) to place on the shirt. */
  pendingAsset?: UploadedCustomImage | null
  onPendingAssetConsumed?: () => void
}

export function CustomDesignTab({ pendingAsset = null, onPendingAssetConsumed }: CustomDesignTabProps = {}) {
  const userId = useAuthStore((state) => state.user?._id)
  return <CustomDesignEditor key={userId ?? 'guest'} storageKey={`altera-custom-design-v2-${userId ?? 'guest'}`} pendingAsset={pendingAsset} onPendingAssetConsumed={onPendingAssetConsumed} />
}

function CustomDesignEditor({ storageKey, pendingAsset, onPendingAssetConsumed }: { storageKey: string } & CustomDesignTabProps) {
  const [design, setDesign] = useState<DesignState>(() => readDesign(storageKey))
  const [undoStack, setUndoStack] = useState<DesignState[]>([])
  const [redoStack, setRedoStack] = useState<DesignState[]>([])
  const [drafts, setDrafts] = useState<CustomDesignDraft[]>([])
  const requestedDraftRef = useRef('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftNameInput, setDraftNameInput] = useState('')
  const [showDraftName, setShowDraftName] = useState(false)
  const [showDraftGallery, setShowDraftGallery] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [templates, setTemplates] = useState<DesignTemplate[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateCategory, setTemplateCategory] = useState('All')
  const [templateDetail, setTemplateDetail] = useState<DesignTemplate | null>(null)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [draftError, setDraftError] = useState('')
  const [showPublish, setShowPublish] = useState(false)
  const [publishName, setPublishName] = useState('')
  const [publishPrice, setPublishPrice] = useState('')
  const [publishDescription, setPublishDescription] = useState('')
  const [publishCategory, setPublishCategory] = useState('')
  const [publishTags, setPublishTags] = useState('')
  const [publishCollectionId, setPublishCollectionId] = useState('')
  const [publishCollections, setPublishCollections] = useState<{ _id: string; name: string }[]>([])
  const [publishing, setPublishing] = useState(false)
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
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'UPLOADED' | 'AI'>('ALL')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const fetchCart = useCartStore((state) => state.fetchCart)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const authenticatedUserId = useAuthStore((state) => state.user?._id)
  const current = [...design[side].layers].sort((a, b) => a.zIndex - b.zIndex)
  const activeImageLayer = current.find(l => l.type === 'image' && l.visible) as ImageLayer | undefined;
  const selected = current.find((layer) => layer.id === selectedId) ?? null
  const commit = (next: DesignState) => { setUndoStack((stack) => [...stack.slice(-49), design]); setRedoStack([]); setDesign(next) }
  const undo = () => { const previous = undoStack.at(-1); if (!previous) return; setRedoStack((stack) => [...stack, design]); setUndoStack((stack) => stack.slice(0, -1)); setDesign(previous) }
  const redo = () => { const next = redoStack.at(-1); if (!next) return; setUndoStack((stack) => [...stack, design]); setRedoStack((stack) => stack.slice(0, -1)); setDesign(next) }

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
  }, [savedSelection.colorName, savedSelection.productId, savedSelection.quantity, savedSelection.size, savedSelection.technique])

  useEffect(() => {
    if (!isAuthenticated) return
    DesignService.getCustomImages()
      .then(({ data }) => setUploads(data.data.images || []))
      .catch((e) => {
        console.warn('Unable to load your image library.', e)
        setUploads([])
      })
  }, [isAuthenticated])

  const colors = product?.colors ?? []
  const sizes = product?.sizes ?? []
  const selectedColor = colors.find((color) => color.name === colorName) ?? null
  const selectedSize = sizes.find((option) => option.label === size) ?? null
  const stock = product ? Math.min(product.stock, selectedColor?.stock ?? product.stock, selectedSize?.stock ?? product.stock) : 0
  const techniques = product?.printingTechniques ?? []
  const selectedTechnique = techniques.find((item) => item.code === technique) ?? null
  const estimatedPrice = useMemo(() => {
    if (!product || !selectedTechnique) return 0
    return (product.discountPrice ?? product.price) + selectedTechnique.price + (printSide === 'BOTH' ? selectedTechnique.additionalSidePrice : 0)
  }, [product, selectedTechnique, printSide])

  useEffect(() => {
    if (estimatedPrice > 0) {
      setPublishPrice(estimatedPrice.toString())
    }
  }, [estimatedPrice])

  useEffect(() => { 
    const persistableDesign = {
      frontDesign: {
        ...design.frontDesign,
        layers: design.frontDesign.layers.map(layer => 
          layer.type === 'image' && (layer as ImageLayer).src && (layer as ImageLayer).src.startsWith('data:image') 
            ? { ...layer, src: '' } 
            : layer
        )
      },
      backDesign: {
        ...design.backDesign,
        layers: design.backDesign.layers.map(layer => 
          layer.type === 'image' && (layer as ImageLayer).src && (layer as ImageLayer).src.startsWith('data:image') 
            ? { ...layer, src: '' } 
            : layer
        )
      }
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(persistableDesign)) 
    } catch (e) {
      console.warn('Failed to persist design to local storage', e);
    }
  }, [design, storageKey])
  useEffect(() => { if (product?._id) localStorage.setItem('altera-custom-selection-v1', JSON.stringify({ productId: product._id, colorName, size, printSide, technique, quantity })) }, [product?._id, colorName, size, printSide, technique, quantity])
  const update = (id: string, patch: Partial<ImageLayer>) => { const next = { ...design, [side]: { layers: design[side].layers.map((layer) => layer.id === id ? { ...layer, ...patch } as DesignLayer : layer) } }; commit(next) }

  const uploadFile = async (file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image size exceeds the 10MB limit.'); return }
    const extension = file.name.split('.').pop()?.toLowerCase()
    const valid = (extension === 'png' && file.type === 'image/png') || (['jpg', 'jpeg'].includes(extension ?? '') && file.type === 'image/jpeg') || (extension === 'webp' && file.type === 'image/webp')
    if (!valid) { setError('Choose a valid PNG, JPG, JPEG, or WEBP image.'); return }
    setUploading(true)
    try {
      const { data } = await DesignService.uploadCustomImage(file)
      const image = data.data.image
      // Keep the file in the personal library and place it on the canvas right away.
      setUploads((currentUploads) => [image, ...currentUploads.filter((item) => item._id !== image._id)])
      addUploadedImage(image)
      setError('')
    } catch (uploadError: unknown) { setError(errorMessage(uploadError, 'Could not upload this image.')) }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = '' }
  }
  const addUploadedImage = (image: UploadedCustomImage) => { const layer = { ...makeImage(image.url), name: isAIAsset(image) ? `AI · ${(image.prompt || 'Design').slice(0, 24)}` : image.filename, zIndex: Math.max(0, ...design[side].layers.map((item) => item.zIndex)) + 1 }; commit({ ...design, [side]: { layers: [...design[side].layers, layer] } }); setSelectedId(layer.id); setError('') }
  const visibleAssets = uploads.filter((image) => assetFilter === 'ALL' || (assetFilter === 'AI' ? isAIAsset(image) : !isAIAsset(image)))
  // Place an asset handed over from the AI tab exactly once.
  const consumedAssetRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pendingAsset || consumedAssetRef.current === pendingAsset._id) return
    consumedAssetRef.current = pendingAsset._id

    const handlePendingAsset = async () => {
      let finalAsset = pendingAsset;
      if (pendingAsset.url.startsWith('data:image')) {
        try {
          setUploading(true);
          const res = await fetch(pendingAsset.url);
          const blob = await res.blob();
          const file = new File([blob], 'ai-design.png', { type: blob.type });
          const { data } = await DesignService.uploadCustomImage(file, 'AI');
          finalAsset = { ...pendingAsset, url: data.data.image.url, source: 'AI', imageType: 'AI' };
        } catch (e) {
          console.error('Failed to upload base64 AI image', e);
          setError('Could not upload AI image to cloud. Please try again.');
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      } else {
        finalAsset = { ...pendingAsset, source: 'AI' };
      }
      setUploads((items) => [finalAsset, ...items.filter((item) => item._id !== pendingAsset._id)])
      setAssetFilter('ALL')
      addUploadedImage(finalAsset)
      onPendingAssetConsumed?.()
    }

    void handlePendingAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAsset])
  const deleteUploadedImage = async (image: UploadedCustomImage) => {
    const inUse = [...design.frontDesign.layers, ...design.backDesign.layers].some((layer) => layer.type === 'image' && layer.src === image.url)
    if (inUse && !window.confirm('This image is being used in your design. Remove it from your library anyway?')) return
    try { await DesignService.deleteCustomImage(image._id, inUse); setUploads((items) => items.filter((item) => item._id !== image._id)); setError('') }
    catch (deleteError: unknown) { setError(errorMessage(deleteError, 'Could not delete this image.')) }
  }
  const removeLayer = (id: string) => { 
    commit({ ...design, [side]: { layers: design[side].layers.filter((layer) => layer.id !== id) } }); 
    if (selectedId === id) setSelectedId(null) 
  }
  const changeLayer = (id: string, patch: Partial<DesignLayer>) => commit({ ...design, [side]: { layers: design[side].layers.map((layer) => layer.id === id ? { ...layer, ...patch } as DesignLayer : layer) } })
  const reorder = (id: string, direction: 'front' | 'forward' | 'backward' | 'back') => {
    const layers = [...current]; const index = layers.findIndex((layer) => layer.id === id); if (index < 0) return
    const [layer] = layers.splice(index, 1); const target = direction === 'front' ? layers.length : direction === 'back' ? 0 : Math.max(0, Math.min(layers.length, index + (direction === 'forward' ? 1 : -1)))
    layers.splice(target, 0, layer); commit({ ...design, [side]: { layers: layers.map((item, i) => ({ ...item, zIndex: i })) } })
  }
  const duplicate = (layer: DesignLayer) => { const copy = { ...layer, id: crypto.randomUUID(), name: `${layer.name} copy`, x: Math.min(100, layer.x + 3), y: Math.min(100, layer.y + 3), zIndex: Math.max(0, ...design[side].layers.map((item) => item.zIndex)) + 1 } as DesignLayer; commit({ ...design, [side]: { layers: [...design[side].layers, copy] } }); setSelectedId(copy.id) }
  const toggleVisibility = (layer: DesignLayer) => changeLayer(layer.id, { visible: !layer.visible })
  const changeSide = (next: 'frontDesign' | 'backDesign') => { setSide(next); setSelectedId(null) }
  const loadTemplates = async () => {
    setTemplateLoading(true); setTemplateError('')
    try { const response = await DesignService.listDesignTemplates(); setTemplates(response.data.data.templates) }
    catch (loadError: unknown) { setTemplateError(errorMessage(loadError, 'Could not load templates.')) }
    finally { setTemplateLoading(false) }
  }
  const openTemplate = async (template: DesignTemplate) => {
    try { const response = await DesignService.getDesignTemplate(template._id); setTemplateDetail(response.data.data.template) }
    catch (openError: unknown) { setTemplateError(errorMessage(openError, 'Could not open this template preview.')) }
  }
  const applyTemplate = (template: DesignTemplate) => {
    const hasDesign = design.frontDesign.layers.length > 0 || design.backDesign.layers.length > 0
    if (hasDesign && !window.confirm('Apply template and replace current design?')) return
    const cloneLayers = (layers: Record<string, unknown>[] = []) => layers.map((item, index) => ({
      ...item, id: crypto.randomUUID(), name: String(item.name || `${item.type === 'text' ? 'Text' : 'Layer'} ${index + 1}`),
      visible: item.visible ?? true, locked: item.locked ?? false, zIndex: typeof item.zIndex === 'number' ? item.zIndex : index,
    })) as DesignLayer[]
    const frontLayers = cloneLayers(template.frontDesign?.layers ?? [])
    const backLayers = cloneLayers(template.backDesign?.layers ?? [])
    commit({ frontDesign: { layers: frontLayers }, backDesign: { layers: backLayers } })
    const nextSide = frontLayers.length ? 'frontDesign' : 'backDesign'
    setSide(nextSide); setSelectedId((nextSide === 'frontDesign' ? frontLayers : backLayers)[0]?.id ?? null)
    setTemplateDetail(null); setShowTemplateGallery(false)
  }
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = templateCategory === 'All' || template.category.toLowerCase() === templateCategory.toLowerCase()
    const query = templateSearch.trim().toLowerCase()
    const matchesSearch = !query || [template.name, template.category, template.style, ...template.tags].some((value) => value.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  })

  const draftPayload = useCallback((name = draftName, overrideDesignUrl?: string) => {
    const activeImageLayer = design[side].layers.find(l => l.type === 'image' && l.visible) as ImageLayer | undefined;
    const finalDesignUrl = overrideDesignUrl ?? activeImageLayer?.src;
    return {
      name: name?.trim() ? name : 'Bản nháp thiết kế', productId: product?._id ?? null,
      color: selectedColor ? { name: selectedColor.name, hex: selectedColor.hex } : null,
      size, printSide, printingTechnique: technique,
      frontDesign: { layers: design.frontDesign.layers, background: null },
      backDesign: { layers: design.backDesign.layers, background: null },
      thumbnail: makeDraftThumbnail(selectedColor?.hex ?? '#ffffff', design[side].layers),
      shirtColor: selectedColor?.hex ?? '#ffffff',
      designUrl: finalDesignUrl,
      decalTransform: activeImageLayer ? {
        x: activeImageLayer.x ?? 50,
        y: activeImageLayer.y ?? 50,
        rotation: activeImageLayer.rotation ?? 0,
        scale: activeImageLayer.scaleX ?? 1,
        opacity: activeImageLayer.opacity ?? 1
      } : undefined,
    }
  }, [draftName, product?._id, selectedColor, size, printSide, technique, design, side])
  const refreshDrafts = useCallback(async () => {
    if (!isAuthenticated) { setDrafts([]); return }
    try { const response = await DesignService.listCustomDrafts(); setDrafts(response.data.data.drafts) }
    catch { setDraftError('Could not load drafts. Please try again.') }
  }, [isAuthenticated])
  const saveDraft = async () => {
    const name = draftNameInput.trim()
    if (!name) { setDraftError('Enter a name for this draft.'); return }
    if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return }
    setDraftError('')
    try {
      let urlOverride: string | undefined;
      const activeImageLayer = design[side].layers.find(l => l.type === 'image' && l.visible) as ImageLayer | undefined;
      if (activeImageLayer?.src?.startsWith('data:')) {
        const res = await fetch(activeImageLayer.src);
        const blob = await res.blob();
        const file = new File([blob], 'design.png', { type: blob.type });
        const { data } = await DesignService.uploadCustomImage(file);
        urlOverride = data.data.image.url;
        changeLayer(activeImageLayer.id, { src: urlOverride });
      }
      const payload = draftPayload(name, urlOverride)
      const response = draftId
        ? await DesignService.updateCustomDraft(draftId, payload)
        : await DesignService.createCustomDraft(payload)
      setDraftId(response.data.data.draft._id)
      setDraftName(name)
      setDraftStatus('saved')
      setShowDraftName(false)
      await refreshDrafts()
    } catch (saveError: unknown) { setDraftError(errorMessage(saveError, 'Could not save this draft.')); setDraftStatus('failed') }
  }
  const publishDesign = async () => {
    if (publishing) return
    if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return }
    const hasFront = design.frontDesign.layers.some((layer) => layer.visible)
    const hasBack = design.backDesign.layers.some((layer) => layer.visible)
    const hasValidLayers = hasFront || hasBack
    if (!publishName.trim()) { setDraftError('Vui lòng nhập tên thiết kế.'); return }
    if (!Number.isFinite(Number(publishPrice)) || Number(publishPrice) < estimatedPrice) { setDraftError(`Vui lòng nhập giá bán lớn hơn hoặc bằng giá gốc (${estimatedPrice.toLocaleString('vi-VN')} ₫).`); return }
    if (!product || !hasValidLayers) { setDraftError('Vui lòng chọn mẫu áo và thêm ít nhất một lớp thiết kế.'); return }
    setPublishing(true); setDraftError('')
    try {
      let urlOverride: string | undefined;
      const activeImageLayer = design[side].layers.find(l => l.type === 'image' && l.visible) as ImageLayer | undefined;
      if (activeImageLayer?.src?.startsWith('data:')) {
        const res = await fetch(activeImageLayer.src);
        const blob = await res.blob();
        const file = new File([blob], 'design.png', { type: blob.type });
        const { data } = await DesignService.uploadCustomImage(file);
        urlOverride = data.data.image.url;
        changeLayer(activeImageLayer.id, { src: urlOverride });
      }

      let id = draftId
      const payload = draftPayload(draftName || publishName, urlOverride)
      const saved = id ? await DesignService.updateCustomDraft(id, payload) : await DesignService.createCustomDraft(payload)
      id = saved.data.data.draft._id; setDraftId(id)
      
      let thumbnailUrl: string | undefined = undefined;
      let canvas = document.getElementById('r3f-shirt-canvas') as HTMLCanvasElement | null;
      if (canvas && typeof canvas.toDataURL !== 'function') {
         canvas = canvas.querySelector('canvas');
      }
      if (canvas && typeof canvas.toDataURL === 'function') {
         const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);
         const res = await fetch(thumbnailBase64);
         const blob = await res.blob();
         const file = new File([blob], 'thumbnail.jpg', { type: blob.type });
         const { data } = await DesignService.uploadCustomImage(file);
         thumbnailUrl = data.data.image.url;
      } else {
         console.error("Failed to target WebGL canvas for snapshot.");
         setDraftError('Lỗi hệ thống: Không thể tạo ảnh xem trước 3D.');
         setPublishing(false);
         return; 
      }
      const publishPayload = { 
        draftId: id, 
        name: publishName.trim(), 
        description: publishDescription, 
        price: Number(publishPrice), 
        category: publishCategory.trim(), 
        tags: publishTags.split(',').map((tag) => tag.trim()).filter(Boolean), 
        collectionId: publishCollectionId || undefined,
        shirtColor: payload.shirtColor,
        designUrl: payload.designUrl,
        decalTransform: payload.decalTransform,
        thumbnailUrl
      };
      
      console.log("PAYLOAD SENDING:", publishPayload);
      const published = await DesignService.publishCustomDraft(publishPayload);
      const status = published.data.data.design?.status
      
      setShowPublish(false);
      setDraftError('');
      toast.success(status === 'PUBLISHED' ? 'Design published successfully!' : 'Design submitted for review.');
      
      // Reset form state
      setPublishName('');
      setPublishDescription('');
      setPublishPrice('');
      setPublishCategory('');
      setPublishTags('');
      setPublishCollectionId('');
      
      await refreshDrafts();
      
      // Redirect
      navigate('/designer/me');
    } catch (err: any) { 
      console.error("PUBLISH ERROR:", err.response?.data || err.message);
      setDraftError(errorMessage(err, 'Could not publish this design.'));
      toast.error(errorMessage(err, 'Could not publish this design.'));
    } finally { 
      setPublishing(false) 
    }
  }
  const createCollection = async () => {
    const name = newCollectionName.trim()
    if (!name) return
    setCreatingCollection(true)
    try {
      const { data } = await DesignService.createDesignerCollection(name)
      const collection = data.data.collection
      setPublishCollections((items) => [...items, collection])
      setPublishCollectionId(collection._id)
      setNewCollectionName('')
    } catch (err) { setDraftError(errorMessage(err, 'Could not create this collection.')) } finally { setCreatingCollection(false) }
  }
  const openPublish = async () => {
    setPublishName(draftName || draftNameInput || '')
    setDraftError('')
    setShowPublish(true)
    if (!isAuthenticated) return
    try {
      const { data: profileResponse } = await DesignService.getMyDesignerProfile()
      const { data: designerResponse } = await DesignService.getDesignerCollections(profileResponse.data.profile.username)
      setPublishCollections(designerResponse.data.collections || [])
    } catch { setPublishCollections([]) }
  }
  const openDraft = useCallback(async (draft: CustomDesignDraft) => {
    try {
      const response = await DesignService.getCustomDraft(draft._id)
      const saved = response.data.data.draft
      const productId = typeof saved.productId === 'string' ? saved.productId : saved.productId?._id
      const nextProduct = products.find((item) => item._id === productId) ?? null
      setProduct(nextProduct)
      setColorName(saved.color?.name ?? nextProduct?.colors?.[0]?.name ?? '')
      setSize(saved.size)
      setPrintSide(saved.printSide)
      setTechnique(saved.printingTechnique)
      const normalizeDraft = (layers: any[]) => layers.map(layer => ({...layer, id: layer.id || crypto.randomUUID()})).filter(layer => layer.type === 'text' || (layer.type === 'image' && layer.src && !layer.src.startsWith('data:'))) as DesignLayer[];
      setDesign({
        frontDesign: { layers: normalizeDraft(saved.frontDesign?.layers ?? []) },
        backDesign: { layers: normalizeDraft(saved.backDesign?.layers ?? []) },
      })
      setSelectedId(null)
      setUndoStack([]); setRedoStack([])
      setDraftId(saved._id); setDraftName(saved.name); setDraftStatus('saved')
      setShowDraftGallery(false); setDraftError('')
    } catch (openError: unknown) { setDraftError(errorMessage(openError, 'Could not open this draft.')) }
  }, [products])
  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get('draft')
    if (!requestedId || requestedDraftRef.current === requestedId || !isAuthenticated || !products.length) return
    const requestedDraft = drafts.find((draft) => draft._id === requestedId)
    if (!requestedDraft) return
    requestedDraftRef.current = requestedId
    const timer = window.setTimeout(() => {
      void openDraft(requestedDraft).then(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('draft')
        window.history.replaceState({}, '', url)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [drafts, isAuthenticated, products, openDraft])
  const renameDraft = async (draft: CustomDesignDraft) => {
    const name = window.prompt('Design name', draft.name)?.trim()
    if (!name || name === draft.name) return
    try { const response = await DesignService.updateCustomDraft(draft._id, { name }); setDrafts((items) => items.map((item) => item._id === draft._id ? response.data.data.draft : item)); if (draftId === draft._id) setDraftName(name) }
    catch (renameError: unknown) { setDraftError(errorMessage(renameError, 'Could not rename this draft.')) }
  }
  const duplicateDraft = async (draft: CustomDesignDraft) => {
    try { const response = await DesignService.duplicateCustomDraft(draft._id); setDrafts((items) => [response.data.data.draft, ...items]) }
    catch (duplicateError: unknown) { setDraftError(errorMessage(duplicateError, 'Could not duplicate this draft.')) }
  }
  const deleteDraft = async (draft: CustomDesignDraft) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return
    try { await DesignService.deleteCustomDraft(draft._id); setDrafts((items) => items.filter((item) => item._id !== draft._id)); if (draftId === draft._id) { setDraftId(null); setDraftName(''); setDraftStatus('idle') } }
    catch (deleteError: unknown) { setDraftError(errorMessage(deleteError, 'Could not delete this draft.')) }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    DesignService.listCustomDrafts().then(({ data }) => { if (active) setDrafts(data.data.drafts) }).catch(() => { if (active) setDraftError('Could not load drafts. Please try again.') })
    return () => { active = false }
  }, [isAuthenticated, authenticatedUserId])
  useEffect(() => {
    if (!draftId || !isAuthenticated || !product) return
    const statusTimer = window.setTimeout(() => setDraftStatus('saving'), 0)
    const timer = window.setTimeout(() => {
      DesignService.updateCustomDraft(draftId, draftPayload())
        .then(({ data }) => { setDraftStatus('saved'); setDrafts((items) => items.map((item) => item._id === draftId ? data.data.draft : item)) })
        .catch(() => setDraftStatus('failed'))
    }, 1500)
    return () => { window.clearTimeout(statusTimer); window.clearTimeout(timer) }
  }, [draftId, isAuthenticated, product, draftPayload])
  const selectProduct = (next: Product | null) => {
    setProduct(next)
    setColorName(next?.colors?.find((item) => item.stock > 0)?.name ?? next?.colors?.[0]?.name ?? '')
    setSize(next?.sizes?.find((item) => item.stock > 0)?.label ?? next?.sizes?.[0]?.label ?? '')
    setTechnique(next?.printingTechniques?.[0]?.code ?? '')
    setQuantity(1)
  }

  const addToOrder = async (orderNow: boolean) => {
    if (!product || !colorName || !size || !printSide || !selectedTechnique) {
      setError('Choose a product, color, size, print side, and printing technique.')
      return
    }
    const hasFront = design.frontDesign.layers.some((layer) => layer.visible)
    const hasBack = design.backDesign.layers.some((layer) => layer.visible)
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
        frontDesign: { layers: design.frontDesign.layers, background: null },
        backDesign: { layers: design.backDesign.layers, background: null },
      } })
      await fetchCart()
      if (orderNow) navigate('/checkout')
      else setError('Added to cart successfully.')
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Could not add this design to cart.'))
    } finally { setSubmitting(false) }
  }

  return showDraftGallery ? <section className="space-y-5 rounded-xl border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Drafts</h2><p className="text-sm text-gray-500">Your saved Custom Design projects</p></div><button onClick={() => setShowDraftGallery(false)} className="rounded border px-4 py-2 text-sm">Back to editor</button></div>
    {draftError && <p role="status" className="text-sm text-red-600">{draftError}</p>}
    {!drafts.length ? <p className="rounded border border-dashed p-8 text-center text-sm text-gray-500">No saved drafts yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{drafts.map((draft) => <article key={draft._id} className="overflow-hidden rounded-lg border">
      {draft.thumbnail ? <img src={draft.thumbnail} alt={`${draft.name} preview`} className="aspect-[3/4] w-full bg-gray-100 object-contain"/> : <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 text-sm text-gray-400">No preview</div>}
      <div className="space-y-2 p-3"><h3 className="truncate font-medium">{draft.name}</h3><p className="text-xs text-gray-500">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(draft.updatedAt))}</p><div className="flex flex-wrap gap-2"><button disabled={loadingProducts} onClick={() => void openDraft(draft)} className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50">{loadingProducts ? 'Loading…' : 'Open'}</button><button onClick={() => void renameDraft(draft)} className="rounded border px-3 py-1.5 text-xs">Rename</button><button onClick={() => void duplicateDraft(draft)} className="rounded border px-3 py-1.5 text-xs">Duplicate</button><button onClick={() => void deleteDraft(draft)} className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600">Delete</button></div></div>
    </article>)}</div>}
  </section> : showTemplateGallery ? <section className="relative space-y-5 rounded-xl border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Template Gallery</h2><p className="text-sm text-gray-500">Choose a starting point and keep every layer editable.</p></div><button onClick={() => setShowTemplateGallery(false)} className="rounded border px-4 py-2 text-sm">Back to editor</button></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px]"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input aria-label="Search templates" placeholder="Search name, category, style, or tag" value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} className="w-full rounded border py-2 pl-9 pr-3 text-sm"/></label><select aria-label="Filter templates by category" value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)} className="rounded border px-3 py-2 text-sm"><option>All</option>{[...new Set(templates.map((template) => template.category))].sort().map((category) => <option key={category}>{category}</option>)}</select></div>
    {templateError && <p role="status" className="text-sm text-red-600">{templateError}</p>}
    {templateLoading ? <p className="py-10 text-center text-sm text-gray-500">Loading templates…</p> : !filteredTemplates.length ? <p className="rounded border border-dashed p-8 text-center text-sm text-gray-500">No templates match these filters.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredTemplates.map((template) => <button key={template._id} onClick={() => void openTemplate(template)} className="overflow-hidden rounded-lg border text-left transition hover:border-black hover:shadow-sm"><img src={template.thumbnail} alt={`${template.name} preview`} loading="lazy" className="aspect-[4/5] w-full bg-gray-100 object-cover"/><span className="block truncate px-3 pt-2 text-sm font-semibold">{template.name}</span><span className="block px-3 pb-3 text-xs text-gray-500">{template.category} · {template.style}</span></button>)}</div>}
    {templateDetail && <div role="dialog" aria-modal="true" aria-labelledby="template-detail-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4" onClick={() => setTemplateDetail(null)}><article className="grid w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl md:grid-cols-2" onClick={(event) => event.stopPropagation()}><img src={templateDetail.thumbnail} alt={`${templateDetail.name} preview`} className="max-h-[70vh] min-h-64 w-full bg-gray-100 object-cover"/><div className="flex flex-col p-5"><div className="flex items-start justify-between gap-2"><h3 id="template-detail-title" className="text-lg font-semibold">{templateDetail.name}</h3><button aria-label="Close template preview" onClick={() => setTemplateDetail(null)} className="rounded border p-1"><X size={16}/></button></div><p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">{templateDetail.category} · {templateDetail.style}</p><p className="mt-4 flex-1 text-sm text-gray-600">{templateDetail.description}</p><p className="mt-3 text-xs text-gray-500">{templateDetail.tags.join(' · ')}</p><button onClick={() => applyTemplate(templateDetail)} className="mt-5 rounded bg-black px-4 py-3 text-sm font-semibold text-white">Use This Template</button></div></article></div>}
  </section> : <div className="grid gap-6 lg:grid-cols-[290px_minmax(300px,1fr)_300px]">
    <aside className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Product</h2>
      <div className="flex flex-wrap gap-2"><button onClick={() => void openPublish()} className="flex flex-1 items-center justify-center gap-1 rounded border border-black bg-[#ffebb3] px-2 py-2 text-xs font-bold uppercase tracking-wide">Đăng Studio</button><button onClick={() => { if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return } setDraftNameInput(draftName || 'My T-Shirt Design'); setDraftError(''); setShowDraftName(true) }} className="flex flex-1 items-center justify-center gap-1 rounded bg-black px-2 py-2 text-xs font-semibold text-white"><Save size={14}/>Lưu nháp</button><button onClick={() => { if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return } void refreshDrafts(); setShowDraftGallery(true) }} className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-2 text-xs"><FolderOpen size={14}/>Drafts</button></div>
      <button onClick={() => { setShowTemplateGallery(true); void loadTemplates() }} className="w-full rounded border px-3 py-2 text-sm font-medium">Template Gallery</button>
      {draftId && <p role="status" className="text-xs text-gray-500">{draftStatus === 'saving' ? 'Saving…' : draftStatus === 'saved' ? `Saved · ${draftName}` : draftStatus === 'failed' ? 'Save failed' : ''}</p>}
      {showPublish && <div role="dialog" aria-modal="true" className="space-y-2 rounded-lg border bg-white p-3"><h3 className="text-sm font-semibold">Publish to your collection</h3><p className="text-xs text-gray-500">Your design will appear on your profile and in the Design Market.</p><input value={publishName} onChange={(e) => setPublishName(e.target.value)} maxLength={120} className="w-full rounded border px-3 py-2 text-sm" placeholder="Design name"/><textarea value={publishDescription} onChange={(e) => setPublishDescription(e.target.value)} maxLength={3000} className="w-full rounded border px-3 py-2 text-sm" placeholder="Description"/><select value={publishCollectionId} onChange={(e) => setPublishCollectionId(e.target.value)} className="w-full rounded border px-3 py-2 text-sm"><option value="">No collection</option>{publishCollections.map((collection) => <option key={collection._id} value={collection._id}>{collection.name}</option>)}</select><div className="flex gap-2"><input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} maxLength={80} className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" placeholder="New collection name"/><button type="button" disabled={creatingCollection || !newCollectionName.trim()} onClick={() => void createCollection()} className="rounded border px-3 py-2 text-xs disabled:opacity-40">{creatingCollection ? 'Creating…' : 'Create'}</button></div><input value={publishCategory} onChange={(e) => setPublishCategory(e.target.value)} maxLength={80} className="w-full rounded border px-3 py-2 text-sm" placeholder="Category"/><input value={publishTags} onChange={(e) => setPublishTags(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Tags, comma separated"/>
<div className="space-y-1">
  <p className="text-xs text-gray-500">Base Cost: {estimatedPrice.toLocaleString('vi-VN')} ₫</p>
  <input type="number" min={estimatedPrice} value={publishPrice} onChange={(e) => setPublishPrice(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Selling Price (VND)"/>
</div>
{draftError && <p role="status" className="text-xs text-red-600">{draftError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setShowPublish(false)} className="rounded border px-3 py-1.5 text-xs">Cancel</button><button disabled={publishing} onClick={() => void publishDesign()} className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50">{publishing ? 'Publishing…' : 'Publish now'}</button></div></div>}      {showDraftName && <div role="dialog" aria-modal="true" aria-labelledby="draft-name-title" className="space-y-2 rounded-lg border bg-gray-50 p-3"><h3 id="draft-name-title" className="text-sm font-semibold">Design name</h3><input autoFocus maxLength={100} value={draftNameInput} onChange={(event) => setDraftNameInput(event.target.value)} className="w-full rounded border bg-white px-3 py-2 text-sm" placeholder="My T-Shirt Design"/>{draftError && <p className="text-xs text-red-600">{draftError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setShowDraftName(false)} className="rounded border px-3 py-1.5 text-xs">Cancel</button><button onClick={() => void saveDraft()} className="rounded bg-black px-3 py-1.5 text-xs text-white">Save</button></div></div>}
      {loadingProducts ? <p className="text-sm text-gray-500">Loading products…</p> : products.length === 0 ? <p className="text-sm text-gray-500">No active T-shirt products are available.</p> : <select aria-label="Product" value={product?._id ?? ''} onChange={(e) => selectProduct(products.find((item) => item._id === e.target.value) ?? null)} className="w-full rounded border p-2 text-sm">{products.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>}
      {product && <>
        <p className="text-sm font-semibold">{formatVND(product.discountPrice ?? product.price)} <span className="font-normal text-gray-500">· Stock {stock}</span></p>
        <div><p className="mb-2 text-xs font-medium">Color</p><div className="flex flex-wrap gap-2">{colors.map((item) => <button key={item.name} title={item.stock <= 0 ? `${item.name} · Out of Stock` : item.name} aria-label={item.name} onClick={() => setColorName(item.name)} className={`h-8 w-8 rounded-full border-2 ${item.stock <= 0 ? 'opacity-40' : ''} ${colorName === item.name ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'}`} style={{ backgroundColor: item.hex }} />)}{colors.length === 0 && <span className="text-xs text-gray-500">No colors configured</span>}</div>{selectedColor && <p className="mt-1 text-xs text-gray-500">{selectedColor.name} · {selectedColor.stock} in stock</p>}</div>
        <label className="block text-sm">Size<select aria-label="Size" className="mt-1 w-full rounded border p-2" value={size} onChange={(e) => setSize(e.target.value)}><option value="">Select size</option>{sizes.map((option) => <option key={option.label} value={option.label}>{option.label}{option.stock <= 0 ? ' · Out of Stock' : ` · ${option.stock} left`}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Print side</p><div className="grid grid-cols-3 gap-1">{([['FRONT', 'Front'], ['BACK', 'Back'], ['BOTH', 'Both Sides']] as const).map(([value, label]) => <button key={value} onClick={() => { setPrintSide(value); if (value === 'FRONT') setSide('frontDesign'); if (value === 'BACK') setSide('backDesign'); }} className={`rounded border px-1 py-2 text-xs ${printSide === value ? 'bg-black text-white' : ''}`}>{label}</button>)}</div></div>
        <label className="block text-sm">Printing technique<select className="mt-1 w-full rounded border p-2" value={technique} onChange={(e) => setTechnique(e.target.value)}><option value="">Select technique</option>{techniques.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Quantity</p><div className="flex items-center gap-3"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded border px-3 py-1 disabled:opacity-40">−</button><span>{quantity}</span><button aria-label="Increase quantity" disabled={quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))} className="rounded border px-3 py-1 disabled:opacity-40">+</button><span className="text-xs text-gray-500">Max {stock}</span></div></div>
        <div className="border-t pt-3"><p className="flex justify-between text-sm"><span>Estimated total</span><strong>{formatVND(estimatedPrice * quantity)}</strong></p><p className="mt-1 text-xs text-gray-500">Product {formatVND(product.discountPrice ?? product.price)} + print {formatVND(selectedTechnique?.price ?? 0)}{printSide === 'BOTH' ? ` + second side ${formatVND(selectedTechnique?.additionalSidePrice ?? 0)}` : ''}{selectedTechnique?.customizationPrice ? ` + customization ${formatVND(selectedTechnique.customizationPrice)}` : ''}</p>{quantity > stock && <p className="mt-1 text-xs text-red-600">Quantity exceeds available stock.</p>}</div>
      </>}
      <div onDragOver={(event) => { event.preventDefault(); setDragOver(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false) }} onDrop={(event) => { event.preventDefault(); setDragOver(false); void uploadFile(event.dataTransfer.files[0]) }} className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${dragOver ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
        <Upload className="mx-auto mb-2" size={20}/><p className="text-sm font-semibold">Drag and drop or click to upload</p><p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, WEBP · Maximum 10MB</p>
        <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-3 rounded border px-3 py-2 text-sm disabled:opacity-50">{uploading ? 'Uploading…' : 'Choose file'}</button>
        <input ref={fileInput} className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => void uploadFile(event.target.files?.[0])}/>
      </div>
      <section aria-label="My image library" className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">THƯ VIỆN ẢNH (AI & UPLOAD)</p><span className="text-[10px] text-gray-400">{visibleAssets.length} images</span></div>
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">{([['ALL', 'All'], ['UPLOADED', 'Uploaded'], ['AI', 'AI']] as const).map(([value, label]) => <button key={value} id={`asset-filter-${value.toLowerCase()}`} role="tab" aria-selected={assetFilter === value} type="button" onClick={() => setAssetFilter(value as any)} className={`rounded-md px-2 py-1 text-xs transition ${assetFilter === value ? 'bg-white font-semibold shadow-sm' : 'text-gray-500 hover:text-black'}`}>{label}</button>)}</div>
        {!isAuthenticated ? <p className="text-xs text-gray-500">Sign in to keep uploaded and AI-generated images in your library.</p> : visibleAssets.length === 0 ? <p className="text-xs text-gray-500">{assetFilter === 'AI' ? 'Generate an image in “Phác thảo mới” and tap “Lưu vào thư viện ảnh”.' : 'Your uploaded and AI images will appear here.'}</p> : <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">{visibleAssets.map((image) => <div key={image._id} className="group relative min-w-0 rounded border p-1 transition hover:border-black">
          <button type="button" onClick={() => addUploadedImage(image)} title={isAIAsset(image) && image.prompt ? `AI: ${image.prompt}` : `Add ${image.filename} to ${side === 'frontDesign' ? 'front' : 'back'}`} className="block w-full text-left"><img src={image.thumbnailUrl || image.url} alt={isAIAsset(image) ? (image.prompt || 'AI design') : image.filename} loading="lazy" className="aspect-square w-full rounded bg-gray-50 object-cover"/><span className="mt-1 block truncate text-[10px]">{isAIAsset(image) ? (image.prompt || 'AI design') : image.filename}</span></button>
          {isAIAsset(image) && <span className="pointer-events-none absolute left-1 top-1 rounded bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">AI</span>}
          <button type="button" onClick={() => void deleteUploadedImage(image)} aria-label={`Remove ${image.filename} from library`} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"><X size={13}/></button>
        </div>)}</div>}
      </section>
      {printSide === 'BOTH' && <div className="flex gap-2"><button onClick={() => changeSide('frontDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'frontDesign' ? 'bg-black text-white' : ''}`}>Front</button><button onClick={() => changeSide('backDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'backDesign' ? 'bg-black text-white' : ''}`}>Back</button></div>}
      <section aria-label="Layers" className="space-y-2 rounded-lg border p-2">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider">Layers · {printSide === 'BOTH' ? (side === 'frontDesign' ? 'Front' : 'Back') : (printSide === 'FRONT' ? 'Front' : 'Back')}</p><div className="flex gap-1"><button title="Undo" aria-label="Undo" disabled={!undoStack.length} onClick={undo} className="rounded border px-2 py-1 text-xs disabled:opacity-40">↶</button><button title="Redo" aria-label="Redo" disabled={!redoStack.length} onClick={redo} className="rounded border px-2 py-1 text-xs disabled:opacity-40">↷</button></div></div>
        {!current.length && <p className="text-sm text-gray-500">No layers yet.</p>}
        {[...current].reverse().map((layer) => <div key={layer.id} className={`rounded border p-1 ${selectedId === layer.id ? 'border-black bg-gray-50' : ''}`}>
          <div className="flex items-center gap-1"><button type="button" title={layer.visible ? 'Hide layer' : 'Show layer'} aria-label={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`} onClick={() => toggleVisibility(layer)} className="rounded p-1">{layer.visible ? <Eye size={15}/> : <EyeOff size={15}/>}</button><button type="button" onClick={() => setSelectedId(layer.id)} className="min-w-0 flex-1 truncate text-left text-sm">{layer.name}</button><button type="button" title={layer.locked ? 'Unlock layer' : 'Lock layer'} aria-label={layer.locked ? `Unlock ${layer.name}` : `Lock ${layer.name}`} onClick={() => changeLayer(layer.id, { locked: !layer.locked })} className="rounded p-1">{layer.locked ? <Lock size={14}/> : <Unlock size={14}/>}</button></div>
          {selectedId === layer.id && <><input aria-label="Rename layer" value={layer.name} onChange={(event) => changeLayer(layer.id, { name: event.target.value })} className="my-1 w-full rounded border px-2 py-1 text-xs"/><div className="flex flex-wrap gap-1"><button title="Bring to Front" onClick={() => reorder(layer.id, 'front')} className="rounded border p-1"><ArrowUp size={14}/></button><button title="Bring Forward" onClick={() => reorder(layer.id, 'forward')} className="rounded border p-1"><ArrowUp size={12}/></button><button title="Send Backward" onClick={() => reorder(layer.id, 'backward')} className="rounded border p-1"><ArrowDown size={12}/></button><button title="Send to Back" onClick={() => reorder(layer.id, 'back')} className="rounded border p-1"><ArrowDown size={14}/></button><button title="Duplicate layer" onClick={() => duplicate(layer)} className="rounded border p-1"><Copy size={14}/></button><button title="Delete layer" onClick={() => removeLayer(layer.id)} disabled={layer.locked} className="rounded border p-1 text-red-600 disabled:opacity-40"><Trash2 size={14}/></button></div></>}
        </div>)}
      </section>
    </aside>
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-100 p-8 relative">
      <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-gray-300">
         <ShirtCanvas3D 
           shirtColor={selectedColor?.hex ?? '#ffffff'} 
           designImage={activeImageLayer?.src}
           decalOpacity={activeImageLayer?.opacity ?? 1}
           decalRotationDegrees={activeImageLayer?.rotation ?? 0}
           decalScaleMultiplier={activeImageLayer?.scaleX ?? 1}
           decalLocked={activeImageLayer?.locked ?? false}
           printSide={printSide === 'BOTH' ? (side === 'frontDesign' ? 'FRONT' : 'BACK') : printSide}
         />
      </div>
    </div>
    <aside className="max-h-[720px] space-y-4 overflow-auto rounded-xl border border-[var(--color-border)] bg-white p-4">
      {selected?.type === 'image' ? <>
        <p className="text-sm font-medium">Image layer</p>
        <label className="block text-sm">Opacity · {Math.round(selected.opacity * 100)}%<input className="w-full" type="range" min="0" max="1" step="0.01" value={selected.opacity} onChange={(e) => update(selected.id, { opacity: Number(e.target.value) })}/></label>
        <label className="block text-sm">Rotate · {selected.rotation}°<input disabled={selected.locked} className="w-full disabled:opacity-40" type="range" min="-180" max="180" value={selected.rotation} onChange={(e) => update(selected.id, { rotation: Number(e.target.value) })}/></label>
        <label className="block text-sm">Resize · {selected.scaleX.toFixed(1)}×<input disabled={selected.locked} className="w-full disabled:opacity-40" type="range" min="0.3" max="3" step="0.1" value={selected.scaleX} onChange={(e) => update(selected.id, { scaleX: Number(e.target.value), scaleY: Number(e.target.value) })}/></label>
      </> : <p className="text-sm text-gray-500">Select a layer to edit its properties.</p>}
      {selected && <button onClick={() => removeLayer(selected.id)} className="flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600"><Trash2 size={16}/>Delete layer</button>}
      <div className="flex items-center gap-2 border-t pt-3 text-xs text-gray-500"><RotateCw size={14}/>Drag on canvas to move · use controls to resize and rotate</div>
      {error && <p role="status" className={`text-sm ${error.startsWith('Added') ? 'text-green-700' : 'text-red-600'}`}>{error}</p>}
      <button disabled={submitting || loadingProducts || !product} onClick={() => void addToOrder(false)} className="w-full rounded-lg border border-black px-4 py-3 text-sm font-semibold disabled:opacity-50">{submitting ? 'Adding…' : 'Add to Cart'}</button>
      <button disabled={submitting || loadingProducts || !product} onClick={() => void addToOrder(true)} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Order Now</button>
    </aside>
  </div>
}
