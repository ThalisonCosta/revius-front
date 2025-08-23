import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  isPasswordVisible?: boolean
  onTogglePassword?: () => void
  showPasswordToggle?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  error,
  hint,
  type,
  isPasswordVisible,
  onTogglePassword,
  showPasswordToggle = type === 'password',
  className = '',
  ...props
}, ref) => {
  const inputType = type === 'password' ? (isPasswordVisible ? 'text' : 'password') : type

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-3 border border-gray-300 dark:border-gray-600 
            rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </motion.div>
  )
})

FormField.displayName = 'FormField'