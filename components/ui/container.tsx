import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide' | 'ultra-wide' | 'narrow'
  as?: keyof import('react').JSX.IntrinsicElements
}

const containerSizes = {
  default: 'max-w-7xl',
  wide: 'max-w-8xl', 
  'ultra-wide': 'max-w-9xl',
  narrow: 'max-w-5xl'
}

const containerPadding = 'px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16'

export function Container({ 
  children, 
  className, 
  size = 'default',
  as: Component = 'div'
}: ContainerProps) {
  return (
    <Component 
      className={cn(
        'w-full mx-auto',
        containerSizes[size],
        containerPadding,
        className
      )}
    >
      {children}
    </Component>
  )
}
