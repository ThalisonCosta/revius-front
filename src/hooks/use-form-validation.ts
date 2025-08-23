import { useState, useCallback } from 'react'

interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: string) => string | undefined
}

interface ValidationSchema {
  [key: string]: ValidationRule
}

interface FormErrors {
  [key: string]: string | undefined
}

interface FormValues {
  [key: string]: string
}

export function useFormValidation(schema: ValidationSchema) {
  const [errors, setErrors] = useState<FormErrors>({})

  const validateField = useCallback((name: string, value: string): string | undefined => {
    const rules = schema[name]
    if (!rules) return undefined

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return 'This field is required'
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return undefined
    }

    // Minimum length validation
    if (rules.min && value.length < rules.min) {
      return `Must be at least ${rules.min} characters`
    }

    // Maximum length validation
    if (rules.max && value.length > rules.max) {
      return `Must be no more than ${rules.max} characters`
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return undefined
  }, [schema])

  const validateForm = useCallback((values: FormValues): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(schema).forEach(field => {
      const error = validateField(field, values[field] || '')
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [schema, validateField])

  const validateSingleField = useCallback((name: string, value: string) => {
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
    return !error
  }, [validateField])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }))
  }, [])

  return {
    errors,
    validateForm,
    validateSingleField,
    clearErrors,
    clearFieldError
  }
}

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address'
      }
      return undefined
    }
  },
  password: {
    required: true,
    min: 8,
    custom: (value: string) => {
      if (value.length < 8) {
        return 'Password must be at least 8 characters'
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }
      return undefined
    }
  },
  username: {
    required: true,
    min: 3,
    max: 30,
    pattern: /^[a-zA-Z0-9_-]+$/,
    custom: (value: string) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Username can only contain letters, numbers, hyphens, and underscores'
      }
      return undefined
    }
  },
  name: {
    required: true,
    min: 2,
    max: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
    custom: (value: string) => {
      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
        return 'Name can only contain letters and spaces'
      }
      return undefined
    }
  }
}