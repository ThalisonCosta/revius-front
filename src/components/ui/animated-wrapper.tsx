'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedWrapperProps {
  children: ReactNode
  className?: string
  variants?: Variants
  initial?: string
  animate?: string
  exit?: string
  whileHover?: string
  whileTap?: string
  viewport?: {
    once?: boolean
    amount?: number
  }
  delay?: number
  duration?: number
  custom?: any
}

export function AnimatedWrapper({
  children,
  className,
  variants,
  initial = 'hidden',
  animate = 'visible',
  exit,
  whileHover,
  whileTap,
  viewport,
  delay = 0,
  duration = 0.5,
  custom,
}: AnimatedWrapperProps) {
  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants || defaultVariants}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={whileHover}
      whileTap={whileTap}
      viewport={viewport}
      custom={custom}
    >
      {children}
    </motion.div>
  )
}