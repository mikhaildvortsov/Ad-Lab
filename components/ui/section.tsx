import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface SectionProps {
  children: ReactNode
  className?: string
  containerSize?: 'default' | 'wide' | 'ultra-wide' | 'narrow'
  padding?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  as?: keyof JSX.IntrinsicElements
}

const paddingSizes = {
  small: 'py-8 sm:py-10 lg:py-12',
  medium: 'py-12 sm:py-16 lg:py-20',
  large: 'py-16 sm:py-20 lg:py-24 xl:py-28',
  xlarge: 'py-20 sm:py-24 lg:py-28 xl:py-32',
  xxlarge: 'py-24 sm:py-28 lg:py-32 xl:py-36'
}

export function Section({ 
  children, 
  className, 
  containerSize = 'default',
  padding = 'medium',
  as: Component = 'section'
}: SectionProps) {
  return (
    <Component className={cn(paddingSizes[padding], className)}>
      <div className={cn(
        'w-full mx-auto',
        containerSize === 'default' && 'max-w-7xl',
        containerSize === 'wide' && 'max-w-8xl',
        containerSize === 'ultra-wide' && 'max-w-9xl',
        containerSize === 'narrow' && 'max-w-5xl',
        'px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16'
      )}>
        {children}
      </div>
    </Component>
  )
}
