import { cn } from "@/lib/utils"
import { ReactNode, ElementType } from "react"

interface TypographyProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

export function Heading1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl',
      'font-bold text-gray-900',
      'mb-6 sm:mb-8 lg:mb-10 xl:mb-12',
      className
    )}>
      {children}
    </Component>
  )
}

export function Heading2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl',
      'font-bold text-gray-900',
      'mb-4 lg:mb-6 xl:mb-8',
      className
    )}>
      {children}
    </Component>
  )
}

export function Heading3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl',
      'font-semibold text-gray-900',
      'mb-3 lg:mb-4 xl:mb-6',
      className
    )}>
      {children}
    </Component>
  )
}

export function BodyLarge({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl',
      'text-gray-600',
      'mb-8 sm:mb-12 lg:mb-16',
      className
    )}>
      {children}
    </Component>
  )
}

export function BodyMedium({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-base sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl',
      'text-gray-600',
      className
    )}>
      {children}
    </Component>
  )
}

export function BodySmall({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn(
      'text-sm lg:text-base xl:text-lg 2xl:text-xl',
      'text-gray-600',
      className
    )}>
      {children}
    </Component>
  )
}
