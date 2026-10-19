import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Copy, Eye, EyeOff, FolderOpen, Lock, RotateCw, Save, Search, Sparkles, Trash2, Unlock, Upload, X } from 'lucide-react'
import { ProductService } from '@/services/product.api'
import { DesignService, type CustomDesignDraft, type DesignTemplate, type UploadedCustomImage } from '@/services/design.api'
import { CartService } from '@/services/cart.api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types/product.types'
import { formatVND, optimizeCloudinaryUrl } from '@/utils/format'
import ShirtCanvas3D from './ShirtCanvas3D'
import { getTemplateThumbnail, BUILTIN_PRESET_TEMPLATES } from './templateMockups'
type ImageLayer = { 
  id: string; 
  type: 'image'; 
  name: string; 
  visible: boolean; 
  locked: boolean; 
  zIndex: number; 
  src: string; 
  x: number; 
  y: number; 
  rotation: number; 
  scaleX: number; 
  scaleY: number; 
  opacity: number;
  position3D?: [number, number, number];
  rotation3D?: [number, number, number];
  blendMode?: 'normal' | 'screen' | 'multiply';
}
type DesignLayer = ImageLayer
type DesignState = { frontDesign: { layers: DesignLayer[] }; backDesign: { layers: DesignLayer[] } }
const isAIAsset = (image: UploadedCustomImage) => image.imageType === 'AI' || image.source === 'AI'
const isPreviewFilename = (filename?: string) => /^(thumbnail|design-preview)/i.test(filename || '')

const makeImage = (src: string, offsetIndex = 0): ImageLayer => {
  const xOffset = ((offsetIndex % 5) - 2) * 8;
  const yOffset = ((offsetIndex % 3) - 1) * 8;
  const posX = (xOffset / 100) * 0.6;
  const posY = 0.1 - (yOffset / 100) * 0.5;
  return { 
    id: crypto.randomUUID(), 
    type: 'image', 
    name: 'Image', 
    visible: true, 
    locked: false, 
    zIndex: Date.now(), 
    src, 
    x: 50 + xOffset, 
    y: 50 + yOffset, 
    rotation: 0, 
    scaleX: 1, 
    scaleY: 1, 
    opacity: 1,
    position3D: [posX, posY, 0.155],
    rotation3D: [Math.PI / 2, 0, 0],
    blendMode: 'normal'
  };
}

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

async function uploadCanvasThumbnail() {
  const canvasRoot = document.getElementById('r3f-shirt-canvas')
  if (canvasRoot?.dataset.modelReady !== 'true') throw new Error('Bản xem trước áo 3D vẫn đang tải. Vui lòng đợi và thử lại.')
  const canvas = canvasRoot instanceof HTMLCanvasElement ? canvasRoot : canvasRoot?.querySelector('canvas')
  if (!canvas) throw new Error('Bản xem trước 3D chưa sẵn sàng. Vui lòng đợi tải xong và thử lại.')
  const blob = await new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Không thể chụp ảnh xem trước 3D.')), 'image/webp', 0.9)
    } else if (typeof canvas.toDataURL === 'function') {
      const dataUrl = canvas.toDataURL('image/webp', 0.9)
      fetch(dataUrl).then((r) => r.blob()).then(resolve).catch(reject)
    } else {
      reject(new Error('Trình duyệt không hỗ trợ chụp ảnh canvas.'))
    }
  })
  const image = new File([blob], 'design-preview.webp', { type: blob.type || 'image/webp' })
  const response = await DesignService.uploadPreviewImage(image)
  return response.data.data.image.url
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
  const [previewThumbnail, setPreviewThumbnail] = useState('')
  const [showCartSuccess, setShowCartSuccess] = useState(false)
  const [draftNameInput, setDraftNameInput] = useState('')
  const [showDraftName, setShowDraftName] = useState(false)
  const [showDraftGallery, setShowDraftGallery] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [templates, setTemplates] = useState<DesignTemplate[]>(BUILTIN_PRESET_TEMPLATES)
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
  const productDetailsRequestRef = useRef(0)
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
  const visibleImageLayers = current.filter((layer) => layer.type === 'image' && layer.visible) as ImageLayer[]
  const selected = current.find((layer) => layer.id === selectedId) ?? null
  const activeImageLayer = (selected?.type === 'image' && selected.visible ? selected : visibleImageLayers[0]) as ImageLayer | undefined
  const commit = (next: DesignState) => { setUndoStack((stack) => [...stack.slice(-49), design]); setRedoStack([]); setDesign(next) }
  const undo = () => { const previous = undoStack.at(-1); if (!previous) return; setRedoStack((stack) => [...stack, design]); setUndoStack((stack) => stack.slice(0, -1)); setDesign(previous) }
  const redo = () => { const next = redoStack.at(-1); if (!next) return; setUndoStack((stack) => [...stack, design]); setRedoStack((stack) => stack.slice(0, -1)); setDesign(next) }

  useEffect(() => {
    let active = true
    ProductService.getProducts({ category: 'T-Shirt', limit: 100 }).then(async ({ data }) => {
      if (!active) return
      const available = data.data.products.filter((item) => item.isActive)
      setProducts(available)
      const initial = available.find((item) => item._id === savedSelection.productId) ?? available[0] ?? null
      if (initial) {
        const requestId = ++productDetailsRequestRef.current
        const { data: productResponse } = await ProductService.getProduct(initial._id)
        if (!active || requestId !== productDetailsRequestRef.current) return
        const detailedProduct = productResponse.data.product
        setProduct(detailedProduct)
        setColorName(detailedProduct.colors?.some((item) => item.name === savedSelection.colorName && item.stock > 0) ? savedSelection.colorName! : detailedProduct.colors?.find((item) => item.stock > 0)?.name ?? '')
        setSize(detailedProduct.sizes?.some((item) => item.label === savedSelection.size && item.stock > 0) ? savedSelection.size! : detailedProduct.sizes?.find((item) => item.stock > 0)?.label ?? '')
        setTechnique(detailedProduct.printingTechniques?.some((item) => item.code === savedSelection.technique) ? savedSelection.technique! : detailedProduct.printingTechniques?.[0]?.code ?? '')
        setQuantity(Math.max(1, savedSelection.quantity ?? 1))
      } else {
        setProduct(null)
      }
    }).catch(() => { if (active) setError('Unable to load products. Please try again.') }).finally(() => { if (active) setLoadingProducts(false) })
    return () => { active = false }
  }, [savedSelection.colorName, savedSelection.productId, savedSelection.quantity, savedSelection.size, savedSelection.technique])

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true

    const fetchAllImages = async () => {
      try {
        // Only fetch explicitly uploaded images. AI designs are loaded on demand
        // by the "Thư viện" tab (DesignStudioPage) to avoid a heavy request on mount.
        const uploadsRes = await DesignService.getCustomImages()

        if (!active) return

        const fetchedImages: UploadedCustomImage[] = (uploadsRes.data.data.images || [])
          .filter((img) => !isPreviewFilename(img.filename))
        // Safely merge with existing state (to preserve pendingAsset or inflight uploads)
        setUploads(prev => {
          const merged = [...prev.filter((img) => !isPreviewFilename(img.filename))];
          for (const img of fetchedImages) {
            if (!merged.some(m => m.url === img.url || m._id === img._id)) {
              merged.push(img);
            }
          }
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        })
      } catch (e) {
        if (active) console.warn('Unable to load your image library.', e)
      }
    }
    
    void fetchAllImages()
    return () => { active = false }
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
    return (product.discountPrice ?? product.price) + selectedTechnique.price + (printSide === 'BOTH' ? selectedTechnique.additionalSidePrice : 0) + (selectedTechnique.customizationPrice ?? 0)
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
      if (!isPreviewFilename(image.filename)) {
        setUploads((currentUploads) => [image, ...currentUploads.filter((item) => item._id !== image._id)])
      }
      addUploadedImage(image)
      setError('')
    } catch (uploadError: unknown) { setError(errorMessage(uploadError, 'Could not upload this image.')) }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = '' }
  }
  const addUploadedImage = (image: UploadedCustomImage) => {
    const offsetIndex = design[side].layers.length;
    const layer = { 
      ...makeImage(image.url, offsetIndex), 
      name: isAIAsset(image) ? `AI · ${(image.prompt || 'Design').slice(0, 24)}` : image.filename, 
      zIndex: Math.max(0, ...design[side].layers.map((item) => item.zIndex)) + 1 
    }; 
    commit({ ...design, [side]: { layers: [...design[side].layers, layer] } }); 
    setSelectedId(layer.id); 
    setError('') 
  }
  const visibleAssets = uploads
    .filter((image) => !isPreviewFilename(image.filename))
    .filter((image) => assetFilter === 'ALL' || (assetFilter === 'AI' ? isAIAsset(image) : !isAIAsset(image)))
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
  const duplicate = (layer: DesignLayer) => { 
    const copy = { 
      ...layer, 
      id: crypto.randomUUID(), 
      name: `${layer.name} copy`, 
      x: Math.min(100, layer.x + 3), 
      y: Math.min(100, layer.y + 3), 
      zIndex: Math.max(0, ...design[side].layers.map((item) => item.zIndex)) + 1,
      position3D: layer.position3D ? [layer.position3D[0] + 0.03, layer.position3D[1] - 0.03, layer.position3D[2]] : undefined,
      rotation3D: layer.rotation3D ? [...layer.rotation3D] : undefined,
    } as DesignLayer; 
    commit({ ...design, [side]: { layers: [...design[side].layers, copy] } }); 
    setSelectedId(copy.id) 
  }
  const toggleVisibility = (layer: DesignLayer) => changeLayer(layer.id, { visible: !layer.visible })
  const changeSide = (next: 'frontDesign' | 'backDesign') => { setSide(next); setSelectedId(null) }
  const loadTemplates = async () => {
    setTemplateLoading(true); setTemplateError('')
    try { 
      const response = await DesignService.listDesignTemplates(); 
      const remote = response.data.data.templates;
      setTemplates(remote && remote.length > 0 ? remote : BUILTIN_PRESET_TEMPLATES) 
    }
    catch { 
      setTemplates(BUILTIN_PRESET_TEMPLATES)
    }
    finally { setTemplateLoading(false) }
  }
  const openTemplate = async (template: DesignTemplate) => {
    if (template._id.startsWith('preset-') || !/^[0-9a-fA-F]{24}$/.test(template._id)) {
      setTemplateDetail(template)
      return
    }
    try { 
      const response = await DesignService.getDesignTemplate(template._id); 
      setTemplateDetail(response.data.data.template || template) 
    }
    catch { 
      setTemplateDetail(template) 
    }
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
      thumbnail: previewThumbnail,
      thumbnailUrl: previewThumbnail || undefined,
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
  }, [draftName, product?._id, selectedColor, size, printSide, technique, design, side, previewThumbnail])
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
      const persistLayerUrls = async (layers: DesignLayer[]) => Promise.all(layers.map(async (layer) => {
        if (layer.type !== 'image' || !layer.src.startsWith('data:')) return { ...layer }
        const response = await fetch(layer.src)
        const blob = await response.blob()
        const file = new File([blob], `${layer.name || 'design'}.png`, { type: blob.type || 'image/png' })
        const uploaded = await DesignService.uploadCustomImage(file)
        return { ...layer, src: uploaded.data.data.image.url }
      }))
      const [frontLayers, backLayers] = await Promise.all([
        persistLayerUrls(design.frontDesign.layers),
        persistLayerUrls(design.backDesign.layers),
      ])
      const persistedDesign = { frontDesign: { ...design.frontDesign, layers: frontLayers }, backDesign: { ...design.backDesign, layers: backLayers } }
      const thumbnail = await uploadCanvasThumbnail()
      setPreviewThumbnail(thumbnail)
      const payload = { ...draftPayload(name), ...persistedDesign, thumbnail, thumbnailUrl: thumbnail }
      setDesign(persistedDesign)
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
      const persistLayerUrls = async (layers: DesignLayer[]) => Promise.all(layers.map(async (layer) => {
        if (layer.type !== 'image' || !layer.src.startsWith('data:')) return { ...layer }
        const response = await fetch(layer.src)
        const blob = await response.blob()
        const file = new File([blob], `${layer.name || 'design'}.png`, { type: blob.type || 'image/png' })
        const uploaded = await DesignService.uploadCustomImage(file)
        return { ...layer, src: uploaded.data.data.image.url }
      }))
      const [frontLayers, backLayers] = await Promise.all([
        persistLayerUrls(design.frontDesign.layers),
        persistLayerUrls(design.backDesign.layers),
      ])
      const persistedDesign = { frontDesign: { ...design.frontDesign, layers: frontLayers }, backDesign: { ...design.backDesign, layers: backLayers } }
      let thumbnailUrl: string | undefined = await uploadCanvasThumbnail()
      setPreviewThumbnail(thumbnailUrl)

      let id = draftId
      const payload = { ...draftPayload(draftName || publishName), ...persistedDesign, thumbnail: thumbnailUrl, thumbnailUrl }
      const saved = id ? await DesignService.updateCustomDraft(id, payload) : await DesignService.createCustomDraft(payload)
      id = saved.data.data.draft._id; setDraftId(id)
      
      if (!thumbnailUrl) {
        let canvas = document.getElementById('r3f-shirt-canvas') as HTMLCanvasElement | null
        if (canvas && typeof canvas.toDataURL !== 'function') {
          canvas = canvas.querySelector('canvas')
        }
        if (canvas && typeof canvas.toDataURL === 'function') {
          const thumbnailBase64 = canvas.toDataURL('image/webp', 0.9)
          const res = await fetch(thumbnailBase64)
          const blob = await res.blob()
          const file = new File([blob], 'thumbnail.webp', { type: blob.type })
          const { data } = await DesignService.uploadPreviewImage(file)
          thumbnailUrl = data.data.image.url
        } else {
          console.error('Failed to target WebGL canvas for snapshot.')
          setDraftError('Lỗi hệ thống: Không thể tạo ảnh xem trước 3D.')
          setPublishing(false)
          return
        }
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
      
      const published = await DesignService.publishCustomDraft(publishPayload);
      const status = published.data.data.design?.status
      
      setShowPublish(false);
      setDraftError('');
      toast.success(status === 'PUBLISHED' ? 'Đã đăng thiết kế thành công lên Marketplace!' : 'Thiết kế đã được gửi để duyệt.');
      
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
      setDraftError(errorMessage(err, 'Không thể đăng thiết kế này. Vui lòng thử lại.'));
      toast.error(errorMessage(err, 'Không thể đăng thiết kế này. Vui lòng thử lại.'));
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
    } catch (err) { setDraftError(errorMessage(err, 'Không thể tạo bộ sưu tập này.')) } finally { setCreatingCollection(false) }
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
      setColorName(saved.color?.name && nextProduct?.colors?.some((item) => item.name === saved.color?.name && item.stock > 0) ? saved.color.name : nextProduct?.colors?.find((item) => item.stock > 0)?.name ?? '')
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
      setPreviewThumbnail(saved.thumbnailUrl || saved.thumbnail || '')
      setDraftId(saved._id); setDraftName(saved.name); setDraftStatus('saved')
      setShowDraftGallery(false); setDraftError('')
    } catch (openError: unknown) { setDraftError(errorMessage(openError, 'Không thể mở bản nháp này.')) }
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
    const name = window.prompt('Tên thiết kế', draft.name)?.trim()
    if (!name || name === draft.name) return
    try { const response = await DesignService.updateCustomDraft(draft._id, { name }); setDrafts((items) => items.map((item) => item._id === draft._id ? response.data.data.draft : item)); if (draftId === draft._id) setDraftName(name) }
    catch (renameError: unknown) { setDraftError(errorMessage(renameError, 'Không thể đổi tên bản nháp này.')) }
  }
  const duplicateDraft = async (draft: CustomDesignDraft) => {
    try { const response = await DesignService.duplicateCustomDraft(draft._id); setDrafts((items) => [response.data.data.draft, ...items]) }
    catch (duplicateError: unknown) { setDraftError(errorMessage(duplicateError, 'Không thể nhân bản bản nháp này.')) }
  }
  const deleteDraft = async (draft: CustomDesignDraft) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết kế này không?')) return
    try { await DesignService.deleteCustomDraft(draft._id); setDrafts((items) => items.filter((item) => item._id !== draft._id)); if (draftId === draft._id) { setDraftId(null); setDraftName(''); setDraftStatus('idle') } }
    catch (deleteError: unknown) { setDraftError(errorMessage(deleteError, 'Không thể xóa bản nháp này.')) }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    DesignService.listCustomDrafts().then(({ data }) => { if (active) setDrafts(data.data.drafts) }).catch(() => { if (active) setDraftError('Không thể tải danh sách bản nháp. Vui lòng thử lại.') })
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
    const requestId = ++productDetailsRequestRef.current
    setProduct(next)
    setColorName(next?.colors?.find((item) => item.stock > 0)?.name ?? '')
    setSize(next?.sizes?.find((item) => item.stock > 0)?.label ?? next?.sizes?.[0]?.label ?? '')
    setTechnique(next?.printingTechniques?.[0]?.code ?? '')
    setQuantity(1)
    if (next) {
      ProductService.getProduct(next._id).then(({ data }) => {
        if (requestId !== productDetailsRequestRef.current) return
        const detailedProduct = data.data.product
        setProduct(detailedProduct)
        setColorName(detailedProduct.colors?.find((item) => item.stock > 0)?.name ?? '')
        setSize(detailedProduct.sizes?.find((item) => item.stock > 0)?.label ?? detailedProduct.sizes?.[0]?.label ?? '')
        setTechnique(detailedProduct.printingTechniques?.[0]?.code ?? '')
      }).catch(() => {
        if (requestId === productDetailsRequestRef.current) setError('Không thể tải kích cỡ sản phẩm. Vui lòng thử lại.')
      })
    }
  }

  const addToOrder = async (orderNow: boolean) => {
    if (!product || !selectedColor || !selectedSize || !printSide || !selectedTechnique) {
      setError('Vui lòng chọn sản phẩm, màu sắc, kích cỡ, mặt in và công nghệ in.')
      return
    }
    const hasFront = design.frontDesign.layers.some((layer) => layer.visible)
    const hasBack = design.backDesign.layers.some((layer) => layer.visible)
    if ((printSide === 'FRONT' && !hasFront) || (printSide === 'BACK' && !hasBack) || (printSide === 'BOTH' && (!hasFront || !hasBack))) {
      setError('Vui lòng thêm lớp thiết kế vào các mặt in đã chọn trước khi đặt hàng.')
      return
    }
    if (quantity < 1 || quantity > stock) {
      setError(quantity > stock ? `Chỉ còn ${stock} sản phẩm trong kho cho lựa chọn này.` : 'Số lượng phải lớn hơn hoặc bằng 1.')
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
      else {
        setError('')
        setShowCartSuccess(true)
      }
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Không thể thêm thiết kế này vào giỏ hàng.'))
    } finally { setSubmitting(false) }
  }

  return showDraftGallery ? <section className="space-y-5 rounded-xl border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Bản nháp</h2><p className="text-sm text-gray-500">Các dự án thiết kế tự chỉnh của bạn</p></div><button onClick={() => setShowDraftGallery(false)} className="rounded border px-4 py-2 text-sm">Quay lại thiết kế</button></div>
    {draftError && <p role="status" className="text-sm text-red-600">{draftError}</p>}
    {!drafts.length ? <p className="rounded border border-dashed p-8 text-center text-sm text-gray-500">Chưa có bản nháp nào được lưu.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{drafts.map((draft) => <article key={draft._id} className="overflow-hidden rounded-lg border">
      {draft.thumbnail ? <img src={optimizeCloudinaryUrl(draft.thumbnail, 500)} alt={`${draft.name} preview`} loading="lazy" decoding="async" className="aspect-[3/4] w-full bg-gray-100 object-contain"/> : <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 text-sm text-gray-400">Chưa có ảnh</div>}
      <div className="space-y-2 p-3"><h3 className="truncate font-medium">{draft.name}</h3><p className="text-xs text-gray-500">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(draft.updatedAt))}</p><div className="flex flex-wrap gap-2"><button disabled={loadingProducts} onClick={() => void openDraft(draft)} className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50">{loadingProducts ? 'Đang tải…' : 'Mở'}</button><button onClick={() => void renameDraft(draft)} className="rounded border px-3 py-1.5 text-xs">Đổi tên</button><button onClick={() => void duplicateDraft(draft)} className="rounded border px-3 py-1.5 text-xs">Nhân bản</button><button onClick={() => void deleteDraft(draft)} className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600">Xóa</button></div></div>
    </article>)}</div>}
  </section> : showTemplateGallery ? <section className="relative space-y-6 rounded-2xl border border-blue-400/15 bg-[#060B16] p-6 text-slate-100 shadow-2xl">
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-400/10 pb-5">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400">
            <Sparkles size={13} className="text-cyan-400" />
            BỘ SƯU TẬP 3D STUDIO
          </span>
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-normal text-white">Thư viện mẫu thiết kế</h2>
        <p className="mt-1 text-sm text-slate-400">Chọn mẫu áo 3D mang phong cách riêng để bắt đầu tùy biến và chỉnh sửa từng chi tiết.</p>
      </div>
      <button 
        type="button"
        onClick={() => setShowTemplateGallery(false)} 
        className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-cyan-400/50 hover:bg-[#162038] hover:text-white"
      >
        <ArrowLeft size={16} /> Quay lại Studio
      </button>
    </div>

    {/* Filter and Search Bar */}
    <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px]">
      <label className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          aria-label="Tìm kiếm mẫu" 
          placeholder="Tìm theo tên mẫu, danh mục, phong cách hoặc thẻ…" 
          value={templateSearch} 
          onChange={(event) => setTemplateSearch(event.target.value)} 
          className="w-full rounded-xl border border-blue-400/20 bg-[#0F172A] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
        />
      </label>
      <select 
        aria-label="Lọc mẫu theo danh mục" 
        value={templateCategory} 
        onChange={(event) => setTemplateCategory(event.target.value)} 
        className="rounded-xl border border-blue-400/20 bg-[#0F172A] px-3.5 py-2.5 text-sm text-slate-200 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 cursor-pointer"
      >
        <option value="All">Tất cả danh mục</option>
        {[...new Set(templates.map((template) => template.category))].sort().map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </div>

    {templateError && <p role="status" className="rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-sm text-red-400">{templateError}</p>}

    {templateLoading ? (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mb-3" />
        <p className="text-sm text-slate-400">Đang tải mẫu thiết kế 3D…</p>
      </div>
    ) : !filteredTemplates.length ? (
      <div className="rounded-2xl border border-dashed border-blue-400/20 bg-[#0F172A]/50 p-12 text-center text-sm text-slate-400">
        Không tìm thấy mẫu phù hợp với từ khóa tìm kiếm.
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredTemplates.map((template) => {
          const thumbSrc = getTemplateThumbnail(template)
          return (
            <button 
              key={template._id} 
              type="button"
              onClick={() => void openTemplate(template)} 
              className="group relative flex flex-col overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] p-2.5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] cursor-pointer"
            >
              {/* T-Shirt 3D Viewport with subtle glow */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#060B16] border border-blue-400/10 flex items-center justify-center p-2">
                {/* Ambient glow behind shirt */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent pointer-events-none group-hover:from-cyan-500/20 transition-all duration-300" />
                
                {/* 3D Shirt Mockup */}
                <img 
                  src={thumbSrc} 
                  alt={`${template.name} preview`} 
                  loading="lazy" 
                  decoding="async" 
                  className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300 ease-out"
                />

                {/* Style badge */}
                <span className="absolute top-2 left-2 rounded-md bg-[#0A1122]/90 backdrop-blur-md border border-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-cyan-300">
                  {template.style}
                </span>
              </div>

              {/* Card Meta */}
              <div className="mt-3 flex flex-1 flex-col justify-between px-1 pb-1">
                <h3 className="truncate font-bold text-sm text-slate-100 group-hover:text-cyan-400 tracking-normal transition-colors">
                  {template.name}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">{template.category}</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity">
                    Khám phá →
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )}

    {/* Detail Preview Modal */}
    {templateDetail && (
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="template-detail-title" 
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4" 
        onClick={() => setTemplateDetail(null)}
      >
        <article 
          className="relative grid w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-400/25 bg-[#0F172A] shadow-[0_20px_50px_rgba(0,0,0,0.85)] md:grid-cols-2 text-slate-100" 
          onClick={(event) => event.stopPropagation()}
        >
          {/* Left Preview: 3D Shirt */}
          <div className="relative flex min-h-[300px] md:min-h-[380px] items-center justify-center bg-[#060B16] p-6 border-b md:border-b-0 md:border-r border-blue-400/15">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
            <img 
              src={getTemplateThumbnail(templateDetail)} 
              alt={`${templateDetail.name} preview`} 
              decoding="async" 
              className="max-h-[360px] w-full object-contain filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.8)]"
            />
            <span className="absolute top-3.5 left-3.5 rounded-md border border-cyan-400/30 bg-[#0A1122]/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              {templateDetail.style}
            </span>
          </div>

          {/* Right Details */}
          <div className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="template-detail-title" className="text-xl font-bold tracking-normal text-white">
                  {templateDetail.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                    {templateDetail.category}
                  </span>
                  <span className="rounded-md border border-blue-400/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                    {templateDetail.style}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                aria-label="Đóng xem trước mẫu" 
                onClick={() => setTemplateDetail(null)} 
                className="rounded-lg border border-blue-400/20 p-1.5 text-slate-400 transition hover:border-cyan-400/50 hover:bg-[#162038] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
              {templateDetail.description}
            </p>

            {templateDetail.tags && templateDetail.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {templateDetail.tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-blue-400/15 bg-[#060B16] px-2 py-0.5 text-[11px] text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <button 
              type="button"
              onClick={() => applyTemplate(templateDetail)} 
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-blue-500 hover:to-cyan-400 hover:scale-[1.01] active:scale-[0.99]"
            >
              Dùng mẫu thiết kế này
            </button>
          </div>
        </article>
      </div>
    )}
  </section> : <div className="grid gap-6 lg:grid-cols-[290px_minmax(300px,1fr)_300px]">
    <aside className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Sản phẩm</h2>
      <div className="flex flex-wrap gap-2"><button onClick={() => void openPublish()} className="flex flex-1 items-center justify-center gap-1 rounded border border-black bg-[#ffebb3] px-2 py-2 text-xs font-bold uppercase tracking-wide">Đăng Studio</button><button onClick={() => { if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return } setDraftNameInput(draftName || 'Thiết kế áo của tôi'); setDraftError(''); setShowDraftName(true) }} className="flex flex-1 items-center justify-center gap-1 rounded bg-black px-2 py-2 text-xs font-semibold text-white"><Save size={14}/>Lưu nháp</button><button onClick={() => { if (!isAuthenticated) { navigate('/auth/login', { state: { from: { pathname: '/design' } } }); return } void refreshDrafts(); setShowDraftGallery(true) }} className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-2 text-xs"><FolderOpen size={14}/>Bản nháp</button></div>
      <button onClick={() => { setShowTemplateGallery(true); void loadTemplates() }} className="w-full rounded-lg border border-blue-400/25 bg-[#0F172A] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-[#162038] flex items-center justify-center gap-1.5"><Sparkles size={14} className="text-cyan-400"/>Thư viện mẫu</button>
      {draftId && <p role="status" className="text-xs text-gray-500">{draftStatus === 'saving' ? 'Đang lưu…' : draftStatus === 'saved' ? `Đã lưu · ${draftName}` : draftStatus === 'failed' ? 'Lưu thất bại' : ''}</p>}
      {showPublish && <div role="dialog" aria-modal="true" className="space-y-2 rounded-lg border bg-white p-3"><h3 className="text-sm font-semibold">Đăng lên Marketplace</h3><p className="text-xs text-gray-500">Thiết kế của bạn sẽ xuất hiện trên trang cá nhân và Marketplace.</p><input value={publishName} onChange={(e) => setPublishName(e.target.value)} maxLength={120} className="w-full rounded border px-3 py-2 text-sm" placeholder="Tên thiết kế"/><textarea value={publishDescription} onChange={(e) => setPublishDescription(e.target.value)} maxLength={3000} className="w-full rounded border px-3 py-2 text-sm" placeholder="Mô tả thiết kế"/><select value={publishCollectionId} onChange={(e) => setPublishCollectionId(e.target.value)} className="w-full rounded border px-3 py-2 text-sm"><option value="">Không thuộc bộ sưu tập</option>{publishCollections.map((collection) => <option key={collection._id} value={collection._id}>{collection.name}</option>)}</select><div className="flex gap-2"><input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} maxLength={80} className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" placeholder="Tên bộ sưu tập mới"/><button type="button" disabled={creatingCollection || !newCollectionName.trim()} onClick={() => void createCollection()} className="rounded border px-3 py-2 text-xs disabled:opacity-40">{creatingCollection ? 'Đang tạo…' : 'Tạo'}</button></div><input value={publishCategory} onChange={(e) => setPublishCategory(e.target.value)} maxLength={80} className="w-full rounded border px-3 py-2 text-sm" placeholder="Danh mục"/><input value={publishTags} onChange={(e) => setPublishTags(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Thẻ (cách nhau bằng dấu phẩy)"/>
<div className="space-y-1">
  <p className="text-xs text-gray-500">Giá gốc phôi áo: {estimatedPrice.toLocaleString('vi-VN')} ₫</p>
  <input type="number" min={estimatedPrice} value={publishPrice} onChange={(e) => setPublishPrice(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" placeholder="Giá bán mong muốn (VNĐ)"/>
</div>
{draftError && <p role="status" className="text-xs text-red-600">{draftError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setShowPublish(false)} className="rounded border px-3 py-1.5 text-xs">Hủy</button><button disabled={publishing || !product} onClick={() => void publishDesign()} className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50">{publishing ? 'Đang đăng…' : 'Đăng bán ngay'}</button></div></div>}      {showDraftName && <div role="dialog" aria-modal="true" aria-labelledby="draft-name-title" className="space-y-2 rounded-lg border bg-gray-50 p-3"><h3 id="draft-name-title" className="text-sm font-semibold">Tên thiết kế</h3><input autoFocus maxLength={100} value={draftNameInput} onChange={(event) => setDraftNameInput(event.target.value)} className="w-full rounded border bg-white px-3 py-2 text-sm" placeholder="Thiết kế áo phông của tôi"/>{draftError && <p className="text-xs text-red-600">{draftError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setShowDraftName(false)} className="rounded border px-3 py-1.5 text-xs">Hủy</button><button onClick={() => void saveDraft()} className="rounded bg-black px-3 py-1.5 text-xs text-white">Lưu</button></div></div>}
      {loadingProducts ? <p className="text-sm text-gray-500">Đang tải phôi áo…</p> : products.length === 0 ? <p className="text-sm text-gray-500">Không có sản phẩm phôi áo khả dụng.</p> : <select aria-label="Sản phẩm" value={product?._id ?? ''} onChange={(e) => selectProduct(products.find((item) => item._id === e.target.value) ?? null)} className="w-full rounded border p-2 text-sm">{products.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>}
      {product && <>
        <p className="text-sm font-semibold">{formatVND(product.discountPrice ?? product.price)} <span className="font-normal text-gray-500">· Kho {stock}</span></p>
        <div><p className="mb-2 text-xs font-medium">Màu sắc</p><div className="flex flex-wrap gap-2">{colors.map((item) => <button key={item.name} disabled={item.stock <= 0} title={item.stock <= 0 ? `${item.name} · Hết hàng` : item.name} aria-label={item.name} onClick={() => setColorName(item.name)} className={`h-8 w-8 rounded-full border-2 disabled:cursor-not-allowed ${item.stock <= 0 ? 'opacity-40' : ''} ${colorName === item.name ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'}`} style={{ backgroundColor: item.hex }} />)}{colors.length === 0 && <span className="text-xs text-gray-500">Chưa có màu sắc</span>}</div>{selectedColor && <p className="mt-1 text-xs text-gray-500">{selectedColor.name} · {selectedColor.stock} trong kho</p>}</div>
        <label className="block text-sm">Kích cỡ<select aria-label="Kích cỡ" className="mt-1 w-full rounded border p-2" value={size} onChange={(e) => setSize(e.target.value)}><option value="">Chọn kích cỡ</option>{sizes.map((option) => <option key={option.label} value={option.label} disabled={option.stock <= 0}>{option.label}{option.stock <= 0 ? ' · Hết hàng' : ` · còn ${option.stock}`}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Mặt in</p><div className="grid grid-cols-3 gap-1">{([['FRONT', 'Mặt trước'], ['BACK', 'Mặt sau'], ['BOTH', 'Cả 2 mặt']] as const).map(([value, label]) => <button key={value} onClick={() => { setPrintSide(value); if (value === 'FRONT') setSide('frontDesign'); if (value === 'BACK') setSide('backDesign'); }} className={`rounded border px-1 py-2 text-xs ${printSide === value ? 'bg-black text-white' : ''}`}>{label}</button>)}</div></div>
        <label className="block text-sm">Công nghệ in<select className="mt-1 w-full rounded border p-2" value={technique} onChange={(e) => setTechnique(e.target.value)}><option value="">Chọn công nghệ in</option>{techniques.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
        <div><p className="mb-2 text-xs font-medium">Số lượng</p><div className="flex items-center gap-3"><button aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded border px-3 py-1 disabled:opacity-40">−</button><span>{quantity}</span><button aria-label="Tăng số lượng" disabled={quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))} className="rounded border px-3 py-1 disabled:opacity-40">+</button><span className="text-xs text-gray-500">Tối đa {stock}</span></div></div>
        <div className="border-t pt-3"><p className="flex justify-between text-sm"><span>Tạm tính</span><strong>{formatVND(estimatedPrice * quantity)}</strong></p><p className="mt-1 text-xs text-gray-500">Phôi áo {formatVND(product.discountPrice ?? product.price)} + in {formatVND(selectedTechnique?.price ?? 0)}{printSide === 'BOTH' ? ` + mặt thứ hai ${formatVND(selectedTechnique?.additionalSidePrice ?? 0)}` : ''}{selectedTechnique?.customizationPrice ? ` + tùy biến ${formatVND(selectedTechnique.customizationPrice)}` : ''}</p>{quantity > stock && <p className="mt-1 text-xs text-red-600">Số lượng vượt quá số lượng trong kho.</p>}</div>
      </>}
      <div onDragOver={(event) => { event.preventDefault(); setDragOver(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false) }} onDrop={(event) => { event.preventDefault(); setDragOver(false); void uploadFile(event.dataTransfer.files[0]) }} className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${dragOver ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
        <Upload className="mx-auto mb-2" size={20}/><p className="text-sm font-semibold">Kéo thả hoặc nhấn để tải ảnh lên</p><p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, WEBP · Tối đa 10MB</p>
        <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-3 rounded border px-3 py-2 text-sm disabled:opacity-50">{uploading ? 'Đang tải lên…' : 'Chọn tệp'}</button>
        <input ref={fileInput} className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => void uploadFile(event.target.files?.[0])}/>
      </div>
      <section aria-label="Thư viện ảnh của tôi" className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">THƯ VIỆN ẢNH (AI & UPLOAD)</p><span className="text-[10px] text-gray-400">{visibleAssets.length} ảnh</span></div>
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">{([['ALL', 'Tất cả'], ['UPLOADED', 'Tải lên'], ['AI', 'AI Tạo']] as const).map(([value, label]) => <button key={value} id={`asset-filter-${value.toLowerCase()}`} role="tab" aria-selected={assetFilter === value} type="button" onClick={() => setAssetFilter(value as any)} className={`rounded-md px-2 py-1 text-xs transition ${assetFilter === value ? 'bg-white font-semibold shadow-sm' : 'text-gray-500 hover:text-black'}`}>{label}</button>)}</div>
        {!isAuthenticated ? <p className="text-xs text-gray-500">Đăng nhập để lưu ảnh tải lên và ảnh tạo bằng AI vào thư viện của bạn.</p> : visibleAssets.length === 0 ? <p className="text-xs text-gray-500">{assetFilter === 'AI' ? 'Tạo ảnh tại tab “Phác thảo mới” và bấm “Lưu vào thư viện ảnh”.' : 'Ảnh bạn tải lên và ảnh AI sẽ hiển thị tại đây.'}</p> : <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">{visibleAssets.map((image) => <div key={image._id} className="group relative min-w-0 rounded border p-1 transition hover:border-black">
          <button type="button" onClick={() => addUploadedImage(image)} title={isAIAsset(image) && image.prompt ? `AI: ${image.prompt}` : `Thêm ${image.filename} vào ${side === 'frontDesign' ? 'mặt trước' : 'mặt sau'}`} className="block w-full text-left"><img src={optimizeCloudinaryUrl(image.thumbnailUrl || image.url, 240)} alt={isAIAsset(image) ? (image.prompt || 'AI design') : image.filename} loading="lazy" decoding="async" className="aspect-square w-full rounded bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#f1f5f9_0%_50%)] [background-size:12px_12px] object-contain p-0.5 border border-slate-200"/><span className="mt-1 block truncate text-[10px]">{isAIAsset(image) ? (image.prompt || 'AI design') : image.filename}</span></button>
          {isAIAsset(image) && <span className="pointer-events-none absolute left-1 top-1 rounded bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">AI</span>}
          <button type="button" onClick={() => void deleteUploadedImage(image)} aria-label={`Xóa ${image.filename} khỏi thư viện`} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"><X size={13}/></button>
        </div>)}</div>}
      </section>
      {printSide === 'BOTH' && <div className="flex gap-2"><button onClick={() => changeSide('frontDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'frontDesign' ? 'bg-black text-white' : ''}`}>Mặt trước</button><button onClick={() => changeSide('backDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'backDesign' ? 'bg-black text-white' : ''}`}>Mặt sau</button></div>}
      <section aria-label="Lớp thiết kế" className="space-y-2 rounded-lg border p-2">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider">Lớp · {printSide === 'BOTH' ? (side === 'frontDesign' ? 'Mặt trước' : 'Mặt sau') : (printSide === 'FRONT' ? 'Mặt trước' : 'Mặt sau')}</p><div className="flex gap-1"><button title="Hoàn tác" aria-label="Hoàn tác" disabled={!undoStack.length} onClick={undo} className="rounded border px-2 py-1 text-xs disabled:opacity-40">↶</button><button title="Làm lại" aria-label="Làm lại" disabled={!redoStack.length} onClick={redo} className="rounded border px-2 py-1 text-xs disabled:opacity-40">↷</button></div></div>
        {!current.length && <p className="text-sm text-gray-500">Chưa có lớp thiết kế nào.</p>}
        {[...current].reverse().map((layer) => <div key={layer.id} className={`rounded border p-1 ${selectedId === layer.id ? 'border-black bg-gray-50' : ''}`}>
          <div className="flex items-center gap-1"><button type="button" title={layer.visible ? 'Ẩn lớp' : 'Hiện lớp'} aria-label={layer.visible ? `Ẩn ${layer.name}` : `Hiện ${layer.name}`} onClick={() => toggleVisibility(layer)} className="rounded p-1">{layer.visible ? <Eye size={15}/> : <EyeOff size={15}/>}</button><button type="button" onClick={() => setSelectedId(layer.id)} className="min-w-0 flex-1 truncate text-left text-sm">{layer.name}</button><button type="button" title={layer.locked ? 'Mở khóa' : 'Khóa lớp'} aria-label={layer.locked ? `Mở khóa ${layer.name}` : `Khóa ${layer.name}`} onClick={() => changeLayer(layer.id, { locked: !layer.locked })} className="rounded p-1">{layer.locked ? <Lock size={14}/> : <Unlock size={14}/>}</button></div>
          {selectedId === layer.id && <><input aria-label="Đổi tên lớp" value={layer.name} onChange={(event) => changeLayer(layer.id, { name: event.target.value })} className="my-1 w-full rounded border px-2 py-1 text-xs"/><div className="flex flex-wrap gap-1"><button title="Đưa lên đầu" onClick={() => reorder(layer.id, 'front')} className="rounded border p-1"><ArrowUp size={14}/></button><button title="Tiến lên một lớp" onClick={() => reorder(layer.id, 'forward')} className="rounded border p-1"><ArrowUp size={12}/></button><button title="Lùi lại một lớp" onClick={() => reorder(layer.id, 'backward')} className="rounded border p-1"><ArrowDown size={12}/></button><button title="Đưa xuống dưới cùng" onClick={() => reorder(layer.id, 'back')} className="rounded border p-1"><ArrowDown size={14}/></button><button title="Nhân bản lớp" onClick={() => duplicate(layer)} className="rounded border p-1"><Copy size={14}/></button><button title="Xóa lớp" onClick={() => removeLayer(layer.id)} disabled={layer.locked} className="rounded border p-1 text-red-600 disabled:opacity-40"><Trash2 size={14}/></button></div></>}
        </div>)}
      </section>
    </aside>
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-100 p-8 relative">
      <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-gray-300">
         <ShirtCanvas3D 
           shirtColor={selectedColor?.hex ?? '#ffffff'} 
           designImage={activeImageLayer?.src}
           designLayers={visibleImageLayers}
           selectedLayerId={selectedId}
           onLayerSelect={setSelectedId}
           onUpdateLayer={(id, patch) => update(id, patch as Partial<ImageLayer>)}
           onLayerPositionChange={(id, x, y) => update(id, { x, y })}
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
        <p className="text-sm font-medium">Lớp hình ảnh</p>
        <label className="block text-sm">Độ mờ · {Math.round(selected.opacity * 100)}%<input className="w-full" type="range" min="0" max="1" step="0.01" value={selected.opacity} onChange={(e) => update(selected.id, { opacity: Number(e.target.value) })}/></label>
        <label className="block text-sm">Xoay · {selected.rotation}°<input disabled={selected.locked} className="w-full disabled:opacity-40" type="range" min="-180" max="180" value={selected.rotation} onChange={(e) => update(selected.id, { rotation: Number(e.target.value) })}/></label>
        <label className="block text-sm">Thu phóng · {selected.scaleX.toFixed(1)}×<input disabled={selected.locked} className="w-full disabled:opacity-40" type="range" min="0.3" max="3" step="0.1" value={selected.scaleX} onChange={(e) => update(selected.id, { scaleX: Number(e.target.value), scaleY: Number(e.target.value) })}/></label>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Chế độ nền (Background Mode)</label>
          <select 
            aria-label="Chế độ nền"
            disabled={selected.locked}
            value={selected.blendMode ?? 'normal'} 
            onChange={(e) => update(selected.id, { blendMode: e.target.value as 'normal' | 'screen' | 'multiply' })} 
            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 transition focus:border-blue-500 focus:outline-none disabled:opacity-40"
          >
            <option value="normal">Mặc định (Giữ nguyên PNG trong suốt)</option>
            <option value="screen">Khử nền đen (Screen / Luma Key)</option>
            <option value="multiply">Khử nền trắng (Multiply / Luma Key)</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            {selected.blendMode === 'screen' 
              ? 'Tự động hòa tách nền đen vào màu vải áo.' 
              : selected.blendMode === 'multiply' 
                ? 'Tự động hòa tách nền trắng vào thớ vải áo.' 
                : 'Hiển thị chuẩn PNG kênh Alpha trong suốt.'}
          </p>
        </div>
      </> : <p className="text-sm text-gray-500">Chọn một lớp để chỉnh sửa thuộc tính.</p>}
      {selected && <button onClick={() => removeLayer(selected.id)} className="flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600"><Trash2 size={16}/>Xóa lớp</button>}
      <div className="flex items-center gap-2 border-t pt-3 text-xs text-gray-500"><RotateCw size={14}/>Kéo trên khung áo để di chuyển · dùng thanh trượt để xoay và thu phóng</div>
      {error && <p role="status" className={`text-sm ${error.startsWith('Added') ? 'text-green-700' : 'text-red-600'}`}>{error}</p>}
      <button disabled={submitting || loadingProducts || !product || !selectedColor || !selectedSize || !selectedTechnique || stock <= 0} onClick={() => void addToOrder(false)} className="w-full rounded-lg border border-black px-4 py-3 text-sm font-semibold disabled:opacity-50">{submitting ? 'Đang thêm…' : 'Thêm vào giỏ'}</button>
      <button disabled={submitting || loadingProducts || !product || !selectedColor || !selectedSize || !selectedTechnique || stock <= 0} onClick={() => void addToOrder(true)} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Mua ngay</button>
    </aside>
    {showCartSuccess && product && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-cart-success-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={() => setShowCartSuccess(false)}
      >
        <div
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowCartSuccess(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
            aria-label="Đóng popup"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 id="custom-cart-success-title" className="text-base font-bold text-neutral-900">
                Đã thêm vào giỏ hàng thành công!
              </h3>
              <p className="text-xs text-neutral-500">Sản phẩm tùy chỉnh đã sẵn sàng trong giỏ hàng</p>
            </div>
          </div>

          <div className="mt-4 flex gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-3.5">
            {activeImageLayer?.src || product.imageUrl ? (
              <img
                src={optimizeCloudinaryUrl(activeImageLayer?.src || product.imageUrl, 200)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 bg-white object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-200 text-xs text-neutral-400">
                No image
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h4 className="truncate text-sm font-semibold text-neutral-900">{product.name}</h4>
              <p className="mt-1 text-xs text-neutral-500">
                Màu: <span className="font-medium text-neutral-800">{selectedColor?.name || colorName}</span>
                {' · '}
                Size: <span className="font-medium text-neutral-800">{size}</span>
                {' · '}
                SL: <span className="font-medium text-neutral-800">{quantity}</span>
              </p>
              <p className="mt-1.5 text-sm font-bold text-neutral-900">
                {formatVND(estimatedPrice * quantity)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowCartSuccess(false)}
              className="w-full rounded-xl border border-neutral-300 py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              Tiếp tục thiết kế
            </button>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex w-full items-center justify-center rounded-xl bg-neutral-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-neutral-800 transition"
            >
              Xem giỏ hàng
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
}
