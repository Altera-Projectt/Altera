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
      navigate(from, { replace: true })
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      const errorMessage = axiosError.response?.data?.message || 'Authentication failed. Please check your credentials.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

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
