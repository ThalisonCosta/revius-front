import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { useFormValidation, validationRules } from '@/hooks/use-form-validation'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

interface SignupForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  bio?: string
  location?: string
}

const signupSchema = {
  username: validationRules.username,
  email: validationRules.email,
  password: validationRules.password,
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: any) => {
      if (value !== formData?.password) {
        return 'Passwords do not match'
      }
      return undefined
    }
  },
  bio: { max: 500 },
  location: { max: 100 }
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { login: setAuthData } = useAuthStore()
  
  const [formData, setFormData] = useState<SignupForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    location: ''
  })
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [emailUpdates, setEmailUpdates] = useState(true)
  
  const { errors, validateForm, validateSingleField, clearFieldError } = useFormValidation(signupSchema)

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearFieldError(field)
    if (apiError) setApiError(null)
    
    // Special handling for confirm password validation
    if (field === 'password' && formData.confirmPassword) {
      validateSingleField('confirmPassword', formData.confirmPassword)
    }
  }

  const handleBlur = (field: keyof SignupForm) => {
    if (field === 'confirmPassword') {
      // Pass the current form data to the custom validator
      const confirmPasswordRule = {
        ...signupSchema.confirmPassword,
        custom: (value: string) => {
          if (value !== formData.password) {
            return 'Passwords do not match'
          }
          return undefined
        }
      }
      
      const error = confirmPasswordRule.custom?.(formData[field]) || 
                   (confirmPasswordRule.required && !formData[field] ? 'This field is required' : undefined)
      
      clearFieldError(field)
      if (error) {
        validateSingleField(field, formData[field])
      }
    } else {
      validateSingleField(field, formData[field])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    
    if (!acceptedTerms || !acceptedPrivacy) {
      setApiError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    
    // Custom validation for confirm password
    const confirmPasswordError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : undefined
    if (confirmPasswordError) {
      validateSingleField('confirmPassword', formData.confirmPassword)
      return
    }
    
    if (!validateForm(formData)) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        location: formData.location
      })
      
      if (response.success && response.data) {
        // Store auth data
        setAuthData(response.data.user, response.data.tokens.access_token, response.data.tokens.refresh_token)
        
        // Redirect to welcome or verification page
        navigate('/welcome', { replace: true })
      }
    } catch (error) {
      console.error('Signup error:', error)
      if (error instanceof ApiError) {
        setApiError(error.message)
      } else {
        setApiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = () => {
    const password = formData.password
    let strength = 0
    let checks = []
    
    if (password.length >= 8) {
      strength += 1
      checks.push('At least 8 characters')
    }
    if (/[A-Z]/.test(password)) {
      strength += 1
      checks.push('Uppercase letter')
    }
    if (/[a-z]/.test(password)) {
      strength += 1
      checks.push('Lowercase letter')
    }
    if (/\d/.test(password)) {
      strength += 1
      checks.push('Number')
    }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1
      checks.push('Special character')
    }
    
    return { strength, checks }
  }

  const { strength, checks } = passwordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Join Revius</h1>
          <p className="text-primary-100">Create your account to start rating and discovering content</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username Field */}
            <FormField
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onBlur={() => handleBlur('username')}
              error={errors.username}
              placeholder="Choose a username"
              disabled={isLoading}
              hint="3-30 characters, letters, numbers, hyphens, and underscores only"
            />

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
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={errors.password}
                placeholder="Create a password"
                disabled={isLoading}
                isPasswordVisible={isPasswordVisible}
                onTogglePassword={() => setIsPasswordVisible(!isPasswordVisible)}
              />
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-4 rounded-full ${
                            i < strength
                              ? strength <= 2
                                ? 'bg-red-500'
                                : strength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {checks.map((check) => (
                      <div key={check} className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              disabled={isLoading}
              isPasswordVisible={isConfirmPasswordVisible}
              onTogglePassword={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Bio (Optional)"
              type="text"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              onBlur={() => handleBlur('bio')}
              error={errors.bio}
              placeholder="Tell us about yourself"
              disabled={isLoading}
              hint={`${formData.bio?.length || 0}/500 characters`}
            />

            <FormField
              label="Location (Optional)"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              onBlur={() => handleBlur('location')}
              error={errors.location}
              placeholder="Your location"
              disabled={isLoading}
            />
          </div>

          {/* Terms and Privacy */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Terms of Service
                </Link>
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="privacy"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="privacy" className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="emails"
                checked={emailUpdates}
                onChange={(e) => setEmailUpdates(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="emails" className="text-sm text-gray-600 dark:text-gray-400">
                I would like to receive email updates about new features and content recommendations
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || !acceptedTerms || !acceptedPrivacy}
            className="w-full"
          >
            Create Account
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors"
            >
              Sign In Instead
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}