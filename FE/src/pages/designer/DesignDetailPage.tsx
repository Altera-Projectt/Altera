import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '@/utils/axios'
import { CartService } from '@/services/cart.api'
type Layer={id?:string;type:'text'|'image';text?:string;src?:string;x?:number;y?:number;zIndex?:number;rotation?:number;scaleX?:number;scaleY?:number;fontSize?:number;fontFamily?:string;fontWeight?:number;color?:string;visible?:boolean}
type Side={layers:Layer[]}
type Detail={_id:string;name:string;description:string;thumbnail:string;price:number;color:{name?:string;hex?:string};size:string;printSide:'FRONT'|'BACK'|'BOTH';printingTechnique:string;category:string;frontDesign:Side;backDesign:Side;designerId:{username:string;displayName:string;avatar?:string};productId:{_id:string;name:string;colors:{name:string;hex:string;stock:number}[];sizes:{label:string;stock:number}[];printingTechniques:{code:string}[];isActive:boolean}}
type Result={design:Detail;likesCount:number;salesCount:number;isLiked:boolean}
export function DesignDetailPage(){
 const {slug=''}=useParams();const [data,setData]=useState<Result|null>(null);const [side,setSide]=useState<'FRONT'|'BACK'>('FRONT');const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false)
 const [selectedColor, setSelectedColor] = useState<{name:string;hex:string}|null>(null)
 const [selectedSize, setSelectedSize] = useState('')
 const load=()=>api.get<{data:Result}>('/designers/design/'+slug).then(r=>{
   setData(r.data.data)
   const p = r.data.data.design.productId
   if (p && p.colors) setSelectedColor(p.colors.find(c => c.stock > 0) || p.colors[0])
   if (p && p.sizes) setSelectedSize(p.sizes.find(s => s.stock > 0)?.label || '')
 }).catch(()=>setError('Không tìm thấy thiết kế này.'))
 useEffect(()=>{void load()},[slug])
 const add=async(buyNow=false)=>{
   if(!data)return;
   if(!selectedColor || !selectedSize) { setMessage('Vui lòng chọn màu và size.'); return; }
   setBusy(true);
   try{
     await CartService.addToCart({
       marketplaceDesignId:data.design._id,
       quantity:1,
       customization: {
         color: { name: selectedColor.name, hex: selectedColor.hex },
         size: selectedSize,
         printSide: data.design.printSide,
         printingTechnique: data.design.printingTechnique || data.design.productId?.printingTechniques?.[0]?.code || 'DTF',
         frontDesign: { layers: data.design.frontDesign?.layers || [], background: null },
         backDesign: { layers: data.design.backDesign?.layers || [], background: null }
       }
     });
     if(buyNow)window.location.assign('/checkout');else setMessage('Đã thêm vào giỏ hàng.')
   }catch{setMessage('Không thể thêm thiết kế vào giỏ hàng.')}finally{setBusy(false)}
 }
 const like=async()=>{if(!data)return;try{await api.request({method:data.isLiked?'DELETE':'POST',url:'/designers/'+data.design._id+'/like'});await load()}catch{setMessage('Đăng nhập để thích thiết kế.')}}
 const share=async()=>{const url=window.location.href;try{if(navigator.share)await navigator.share({title:data?.design.name,url});else{await navigator.clipboard.writeText(url);setMessage('Đã sao chép liên kết.')}}catch{/* User cancelled the share sheet. */}}
 if(error)return <div className="py-24 text-center">{error}</div>;if(!data)return <div className="py-24 text-center">Đang tải thiết kế…</div>
 const d=data.design,layers=(side==='FRONT'?d.frontDesign?.layers:d.backDesign?.layers)||[]
 return <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2"><div><div className="mb-3 flex gap-2">{d.printSide!=='BACK'&&<button onClick={()=>setSide('FRONT')} className={side==='FRONT'?'border-b-2 border-black px-3 py-2':'px-3 py-2'}>Front</button>}{d.printSide!=='FRONT'&&<button onClick={()=>setSide('BACK')} className={side==='BACK'?'border-b-2 border-black px-3 py-2':'px-3 py-2'}>Back</button>}</div><div className="relative aspect-square overflow-hidden bg-neutral-100"><svg viewBox="0 0 400 440" className="absolute inset-0 h-full w-full" aria-label="Garment preview"><path d="M125 48 170 25h60l45 23 85 58-45 68-45-28v260H130V146l-45 28-45-68z" fill={selectedColor?.hex||'#f5f5f4'} stroke="#d4d4d4" strokeWidth="5"/><path d="M170 25q30 58 60 0" fill="none" stroke="#d4d4d4" strokeWidth="5"/></svg><div className="absolute left-[25%] top-[25%] h-[48%] w-[50%]">{layers.filter(l=>l.visible!==false).sort((a,b)=>(a.zIndex||0)-(b.zIndex||0)).map((l,i)=><div key={l.id||i} className="absolute flex items-center justify-center text-center" style={{left:(l.x??50)+'%',top:(l.y??50)+'%',zIndex:l.zIndex||i,transform:'translate(-50%,-50%) rotate('+(l.rotation||0)+'deg) scale('+(l.scaleX||1)+','+(l.scaleY||1)+')',fontSize:l.fontSize?Math.max(10,l.fontSize/2):18,fontFamily:l.fontFamily||'sans-serif',fontWeight:l.fontWeight||500,color:l.color||'#111',maxWidth:'90%'}}>{l.type==='image'&&l.src?<img src={l.src} alt="" className="max-h-24 max-w-24 object-contain"/>:l.text}</div>)}</div></div><p className="mt-2 text-center text-xs uppercase tracking-widest text-neutral-500">{side} preview · design layers</p></div><section className="py-4"><p className="text-xs uppercase tracking-[.2em] text-neutral-500">{d.category||'ALTERA DESIGN'}</p><h1 className="mt-3 font-heading text-3xl uppercase tracking-wide">{d.name}</h1><p className="mt-4 text-xl">{d.price.toLocaleString('vi-VN')} ₫</p><p className="mt-6 whitespace-pre-wrap text-neutral-600">{d.description}</p>
 <div className="mt-8 border-y py-5 space-y-5">
  <div><p className="text-sm text-neutral-500 mb-2">Color: <span className="font-medium text-black">{selectedColor?.name}</span></p><div className="flex flex-wrap gap-2">{d.productId?.colors?.map(c => <button key={c.hex} disabled={c.stock < 1} onClick={() => setSelectedColor(c)} className={`h-8 w-8 rounded-full border-2 ${selectedColor?.hex === c.hex ? 'border-black' : 'border-transparent shadow-sm'} ${c.stock < 1 ? 'opacity-20 cursor-not-allowed' : ''}`} style={{backgroundColor: c.hex}} title={c.name}></button>)}</div></div>
  <div><p className="text-sm text-neutral-500 mb-2">Size: <span className="font-medium text-black">{selectedSize}</span></p><div className="flex flex-wrap gap-2">{d.productId?.sizes?.map(s => <button key={s.label} disabled={s.stock < 1} onClick={() => setSelectedSize(s.label)} className={`min-w-[3rem] px-3 py-1.5 rounded border text-sm font-medium ${selectedSize === s.label ? 'border-black bg-black text-white' : 'border-neutral-200'} ${s.stock < 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-black'}`}>{s.label}</button>)}</div></div>
 </div>
 <Link className="mt-7 inline-flex items-center gap-3" to={'/designer/'+d.designerId.username}><img src={d.designerId.avatar||'/favicon.svg'} alt="" className="h-10 w-10 rounded-full object-cover"/><span>View designer · {d.designerId.displayName}</span></Link><div className="mt-7 flex gap-3"><button onClick={()=>void like()} className="border px-4 py-2">{data.isLiked?'♥ Liked':'♡ Like'} · {data.likesCount}</button><button onClick={()=>void share()} className="border px-4 py-2">Share</button><span className="px-2 py-2 text-sm text-neutral-500">{data.salesCount} sales</span></div><button disabled={busy} onClick={()=>void add()} className="mt-4 w-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{busy?'Đang thêm…':'Add to Cart'}</button><button disabled={busy} onClick={()=>void add(true)} className="mt-3 w-full border border-neutral-900 px-6 py-3 text-sm font-medium disabled:opacity-50">Buy Now</button>{message&&<p role="status" className={`mt-3 text-sm ${message.includes('Vui lòng') || message.includes('Không thể') ? 'text-red-600' : 'text-neutral-600'}`}>{message}</p>}</section></main>
}
