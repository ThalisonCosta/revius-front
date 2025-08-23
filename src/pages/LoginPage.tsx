import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { useFormValidation, validationRules } from '@/hooks/use-form-validation'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

interface LoginForm {
  email: string
  password: string
}

const loginSchema = {
  email: validationRules.email,
  password: { required: true }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: setAuthData } = useAuthStore()
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  })
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { errors, validateForm, validateSingleField, clearFieldError } = useFormValidation(loginSchema)

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearFieldError(field)
    if (apiError) setApiError(null)
  }

  const handleBlur = (field: keyof LoginForm) => {
    validateSingleField(field, formData[field])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    
    if (!validateForm(formData)) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await authApi.login(formData.email, formData.password)
      
      if (response.success && response.data) {
        // Store auth data
        setAuthData(response.data.user, response.data.tokens.access_token, response.data.tokens.refresh_token)
        
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }
        
        // Redirect to home or intended page
        const from = new URLSearchParams(location.search).get('from') || '/'
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-white">
          <div className="flex items-center mb-4">
            <Link
              to="/"
              className="mr-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-primary-100">Sign in to your Revius account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* API Error */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300 text-sm">{apiError}</p>
            </motion.div>
          )}

          {/* Email Field */}
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            placeholder="Enter your email"
            disabled={isLoading}
          />

          {/* Password Field */}
          <FormField
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            error={errors.password}
            placeholder="Enter your password"
            disabled={isLoading}
            isPasswordVisible={isPasswordVisible}
            onTogglePassword={() => setIsPasswordVisible(!isPasswordVisible)}
          />

          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Remember me
              </span>
            </label>
            
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Sign In
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}