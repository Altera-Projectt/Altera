import { useEffect, useRef, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Plus, RotateCw, Trash2, Underline } from 'lucide-react'

type TextEffect = 'Straight' | 'Wave' | 'Pinch' | 'Tilt Right' | 'Tilt Left' | 'Curve Up' | 'Flag' | 'Inflate' | 'Curve Down'
type TextLayer = {
  id: string; type: 'text'; text: string; fontFamily: string; fontSize: number; fontWeight: number
  italic: boolean; underline: boolean; textTransform: 'none' | 'uppercase' | 'lowercase'
  align: 'left' | 'center' | 'right'; color: string; stroke: string; strokeWidth: number; opacity: number
  x: number; y: number; rotation: number; scaleX: number; scaleY: number; effect: TextEffect
}
type DesignState = { frontDesign: TextLayer[]; backDesign: TextLayer[] }
const STORAGE_KEY = 'altera-custom-design-v1'
const FONTS = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Bebas Neue', 'Arial']
const EFFECTS: TextEffect[] = ['Straight', 'Wave', 'Pinch', 'Tilt Right', 'Tilt Left', 'Curve Up', 'Flag', 'Inflate', 'Curve Down']

const makeText = (): TextLayer => ({
  id: crypto.randomUUID(), type: 'text', text: 'Your Text', fontFamily: 'Inter', fontSize: 32, fontWeight: 400,
  italic: false, underline: false, textTransform: 'none', align: 'center', color: '#111111', stroke: '#ffffff',
  strokeWidth: 0, opacity: 1, x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1, effect: 'Straight',
})

function readDesign(): DesignState {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value) return JSON.parse(value) as DesignState
  } catch { /* Start with an empty design if saved data is unavailable. */ }
  return { frontDesign: [], backDesign: [] }
}

function effectStyle(effect: TextEffect): React.CSSProperties {
  const styles: Record<TextEffect, React.CSSProperties> = {
    Straight: {}, Wave: { transform: 'skewY(-8deg) rotate(-2deg)' }, Pinch: { transform: 'scaleX(.78) scaleY(1.12)' },
    'Tilt Right': { transform: 'rotate(8deg)' }, 'Tilt Left': { transform: 'rotate(-8deg)' },
    'Curve Up': { transform: 'rotate(-5deg) scaleX(.94)' }, Flag: { transform: 'skewY(9deg) scaleX(1.06)' },
    Inflate: { transform: 'scale(1.12)', letterSpacing: '.04em' }, 'Curve Down': { transform: 'rotate(5deg) scaleX(.94)' },
  }
  return styles[effect]
}

export function CustomDesignTab() {
  const [design, setDesign] = useState<DesignState>(readDesign)
  const [side, setSide] = useState<'frontDesign' | 'backDesign'>('frontDesign')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const drag = useRef<{ id: string; x: number; y: number; left: number; top: number } | null>(null)
  const current = design[side]
  const selected = current.find((layer) => layer.id === selectedId) ?? null

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)) }, [design])
  const update = (id: string, patch: Partial<TextLayer>) => setDesign((prev) => ({ ...prev, [side]: prev[side].map((layer) => layer.id === id ? { ...layer, ...patch } : layer) }))
  const addText = () => { const layer = makeText(); setDesign((prev) => ({ ...prev, [side]: [...prev[side], layer] })); setSelectedId(layer.id) }
  const removeText = () => { if (!selectedId) return; setDesign((prev) => ({ ...prev, [side]: prev[side].filter((layer) => layer.id !== selectedId) })); setSelectedId(null) }
  const changeSide = (next: 'frontDesign' | 'backDesign') => { setSide(next); setSelectedId(null) }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    update(drag.current.id, { x: Math.min(100, Math.max(0, drag.current.left + (event.clientX - drag.current.x) / bounds.width * 100)), y: Math.min(100, Math.max(0, drag.current.top + (event.clientY - drag.current.y) / bounds.height * 100)) })
  }

  return <div className="grid gap-6 lg:grid-cols-[290px_minmax(300px,1fr)_300px]">
    <aside className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <button onClick={addText} className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white"><Plus size={16}/>Add Text</button>
      <div className="flex gap-2"><button onClick={() => changeSide('frontDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'frontDesign' ? 'bg-black text-white' : ''}`}>Front</button><button onClick={() => changeSide('backDesign')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${side === 'backDesign' ? 'bg-black text-white' : ''}`}>Back</button></div>
      <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Layers · {side === 'frontDesign' ? 'Front' : 'Back'}</p>
        {current.length === 0 && <p className="text-sm text-gray-500">No text layers yet.</p>}
        {current.map((layer, index) => <button key={layer.id} onClick={() => setSelectedId(layer.id)} className={`w-full truncate rounded border px-3 py-2 text-left text-sm ${selectedId === layer.id ? 'border-black bg-gray-50' : ''}`}>T{index + 1} · {layer.text || 'Text'}</button>)}
      </div>
    </aside>
    <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-gray-200 bg-gray-100 p-8">
      <div className="relative aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-gray-300 bg-white shadow-xl" onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }}>
        <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 rounded-b-full border-b border-gray-200" />
        {current.map((layer) => <div key={layer.id} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(layer.id); drag.current = { id: layer.id, x: event.clientX, y: event.clientY, left: layer.x, top: layer.y } }} onClick={() => setSelectedId(layer.id)} className={`absolute max-w-[90%] cursor-move whitespace-pre-wrap break-words px-2 ${selectedId === layer.id ? 'outline outline-1 outline-blue-500 outline-dashed' : ''}`} style={{ left: `${layer.x}%`, top: `${layer.y}%`, transformOrigin: 'center', fontFamily: `"${layer.fontFamily}", sans-serif`, fontSize: `${layer.fontSize}px`, fontWeight: layer.fontWeight, fontStyle: layer.italic ? 'italic' : 'normal', textDecoration: layer.underline ? 'underline' : 'none', textTransform: layer.textTransform, textAlign: layer.align, color: layer.color, WebkitTextStroke: `${layer.strokeWidth}px ${layer.stroke}`, opacity: layer.opacity, ...effectStyle(layer.effect), transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scaleX}, ${layer.scaleY}) ${effectStyle(layer.effect).transform ?? ''}`, touchAction: 'none' }}>{layer.text || ' '}</div>)}
      </div>
    </div>
    <aside className="max-h-[720px] space-y-4 overflow-auto rounded-xl border border-[var(--color-border)] bg-white p-4">
      {selected ? <>
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
        <label className="block text-sm">Scale · {selected.scaleX.toFixed(1)}×<input className="w-full" type="range" min="0.3" max="3" step="0.1" value={selected.scaleX} onChange={(e) => update(selected.id, { scaleX: Number(e.target.value), scaleY: Number(e.target.value) })}/></label>
        <button onClick={removeText} className="flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600"><Trash2 size={16}/>Delete layer</button>
      </> : <p className="text-sm text-gray-500">Select a text layer or add text to edit its properties.</p>}
      <div className="flex items-center gap-2 border-t pt-3 text-xs text-gray-500"><RotateCw size={14}/>Drag on canvas to move · use controls to resize and rotate</div>
    </aside>
  </div>
}
