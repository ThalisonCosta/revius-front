import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, CheckCircle2, Mail, KeyRound } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { useFormValidation, validationRules } from '@/hooks/use-form-validation'
import { authApi, ApiError } from '@/lib/api'

interface ForgotPasswordForm {
  email: string
}

const forgotPasswordSchema = {
  email: validationRules.email
}

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordForm>({
    email: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isEmailSent, setIsEmailSent] = useState(false)
  
  const { errors, validateForm, validateSingleField, clearFieldError } = useFormValidation(forgotPasswordSchema)

  const handleInputChange = (field: keyof ForgotPasswordForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearFieldError(field)
    if (apiError) setApiError(null)
  }

  const handleBlur = (field: keyof ForgotPasswordForm) => {
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
      const response = await authApi.forgotPassword(formData.email)
      
      if (response.success) {
        setIsEmailSent(true)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setApiError(null)
    setIsLoading(true)
    
    try {
      const response = await authApi.forgotPassword(formData.email)
      
      if (response.success) {
        // Show success message or handle resend confirmation
        setApiError(null)
      }
    } catch (error) {
      console.error('Resend email error:', error)
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('Failed to resend email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-green-100">Password reset instructions sent</p>
          </div>

          {/* Instructions */}
          <div className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a password reset link to:
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formData.email}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            {/* Error for resend */}
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

            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full"
              >
                Resend Email
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or contact support.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
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
              to="/login"
              className="mr-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-primary-100">Enter your email to receive reset instructions</p>
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

          {/* Instructions */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We'll send you a secure link to reset your password
            </p>
          </div>

          {/* Email Field */}
          <FormField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            placeholder="Enter your email address"
            disabled={isLoading}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Send Reset Link
          </Button>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}