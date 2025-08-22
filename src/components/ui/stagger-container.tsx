'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  childDelay?: number
  once?: boolean
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  childDelay = 0.1,
  once = true,
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function StaggerItem({ children, className, index }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      custom={index}
    >
      {children}
    </motion.div>
  )
}