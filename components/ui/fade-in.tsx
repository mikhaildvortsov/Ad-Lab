"use client"

import { useEffect, useRef, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
  threshold?: number
}

export function FadeIn({ 
  children, 
  className, 
  delay = 0, 
  direction = 'up',
  duration = 1000,
  threshold = 0.1
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(30px)'
      case 'down':
        return 'translateY(-30px)'
      case 'left':
        return 'translateX(30px)'
      case 'right':
        return 'translateX(-30px)'
      default:
        return 'none'
    }
  }

  const getInitialTransform = () => {
    if (direction === 'none') return 'none'
    return getTransform()
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-1000 ease-out',
        className
      )}
      style={{
        transform: isVisible ? 'none' : getInitialTransform(),
        opacity: isVisible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Варианты анимации для разных направлений
export function FadeInUp({ children, className, delay = 0, duration = 1000 }: Omit<FadeInProps, 'direction'>) {
  return (
    <FadeIn direction="up" delay={delay} duration={duration} className={className}>
      {children}
    </FadeIn>
  )
}

export function FadeInDown({ children, className, delay = 0, duration = 1000 }: Omit<FadeInProps, 'direction'>) {
  return (
    <FadeIn direction="down" delay={delay} duration={duration} className={className}>
      {children}
    </FadeIn>
  )
}

export function FadeInLeft({ children, className, delay = 0, duration = 1000 }: Omit<FadeInProps, 'direction'>) {
  return (
    <FadeIn direction="left" delay={delay} duration={duration} className={className}>
      {children}
    </FadeIn>
  )
}

export function FadeInRight({ children, className, delay = 0, duration = 1000 }: Omit<FadeInProps, 'direction'>) {
  return (
    <FadeIn direction="right" delay={delay} duration={duration} className={className}>
      {children}
    </FadeIn>
  )
}

export function FadeInScale({ children, className, delay = 0, duration = 1000 }: Omit<FadeInProps, 'direction'>) {
  return (
    <FadeIn direction="none" delay={delay} duration={duration} className={className}>
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          transform: 'scale(0.9)',
          opacity: 0,
          transitionDelay: `${delay}ms`,
          transitionDuration: `${duration}ms`
        }}
      >
        {children}
      </div>
    </FadeIn>
  )
}
