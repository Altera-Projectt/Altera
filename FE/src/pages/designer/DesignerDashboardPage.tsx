import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/axios'
type Profile={username:string}
export function DesignerDashboardPage(){const navigate=useNavigate();const [failed,setFailed]=useState(false);useEffect(()=>{api.get<{data:{profile:Profile}}>('/designers/me/profile').then(({data})=>navigate(`/designer/${data.data.profile.username}`,{replace:true})).catch(()=>setFailed(true))},[navigate]);return <div className="py-24 text-center">{failed?'Không thể tải hồ sơ designer.':'Đang mở hồ sơ designer…'}</div>}
