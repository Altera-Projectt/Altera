import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from '@/router'

function App() {
  useEffect(() => {
    // Early wake-up: Gửi ping ngầm đánh thức server Render ngay khi user vừa mở web
    const baseUrl = import.meta.env.VITE_API_URL || 'https://altera-2v4j.onrender.com/api/v1'
    const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`
    fetch(healthUrl, { mode: 'cors' }).catch(() => {
      // Fire-and-forget, bỏ qua lỗi ngầm nếu có
    })
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
