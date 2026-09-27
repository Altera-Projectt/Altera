import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api.types'
import { useGoogleLogin } from '@react-oauth/google'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const storeLogin = useAuthStore((state) => state.login)
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect path after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const response = await AuthService.login(data)
      const { user, token } = response.data.data
      
      storeLogin(user, token)
      toast.success(response.data.message || 'Successfully signed in.')
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : from, { replace: true })
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      const errorMessage = axiosError.response?.data?.message || 'Authentication failed. Please check your credentials.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      try {
        const response = await AuthService.loginWithGoogle(tokenResponse.access_token)
        const { user, token } = response.data.data
        
        storeLogin(user, token)
        toast.success(response.data.message || 'Successfully signed in with Google.')
        navigate(from, { replace: true })
      } catch (error) {
        toast.error('Google authentication failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      toast.error('Google authentication was canceled or failed.')
    },
  })

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 bg-[var(--color-background)]">
      <Card className="w-full max-w-md border border-[var(--color-border)] bg-[var(--color-background)] p-8 shadow-sm">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="font-heading text-3xl font-black tracking-widest uppercase text-[var(--color-foreground)]">
            ALTERA
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Sign in to your account to continue
          </p>
        </div>

        {from !== '/' && (
          <div className="mt-6 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-4 py-3 text-sm text-[var(--color-foreground)]">
            <AlertCircle className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            Vui lòng đăng nhập để sử dụng tính năng này.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              required
              disabled={isLoading}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex h-full items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] focus:outline-none"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                required
                disabled={isLoading}
                {...register('password')}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full uppercase font-semibold tracking-wider"
            loading={isLoading}
          >
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--color-background)] px-2 text-[var(--color-muted-foreground)]">
                Hoặc
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => handleGoogleLogin()}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Tiếp tục với Google
          </Button>

          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            Don't have an account?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}
