import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"

interface AdaptiveCardProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
}

const sizeClasses = {
  sm: 'p-4 sm:p-6',
  md: 'p-6 sm:p-8 lg:p-10',
  lg: 'p-8 sm:p-10 lg:p-12',
  xl: 'p-10 sm:p-12 lg:p-16'
}

const hoverClasses = 'hover:shadow-lg lg:hover:shadow-xl transition-shadow cursor-pointer'

export function AdaptiveCard({ 
  children, 
  className, 
  size = 'md',
  hover = false
}: AdaptiveCardProps) {
  return (
    <Card className={cn(
      'bg-white rounded-xl lg:rounded-2xl shadow-sm lg:shadow-md border',
      hover && hoverClasses,
      className
    )}>
      <CardContent className={cn(sizeClasses[size])}>
        {children}
      </CardContent>
    </Card>
  )
}

export function AdaptiveCardWithHeader({ 
  title,
  description,
  children, 
  className, 
  size = 'md',
  hover = false
}: AdaptiveCardProps & { title?: string; description?: string }) {
  return (
    <Card className={cn(
      'bg-white rounded-xl lg:rounded-2xl shadow-sm lg:shadow-md border',
      hover && hoverClasses,
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          'text-center pb-6 lg:pb-8',
          size === 'lg' && 'pb-8 lg:pb-10',
          size === 'xl' && 'pb-10 lg:pb-12'
        )}>
          {title && (
            <CardTitle className={cn(
              'text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-2 lg:mb-3',
              size === 'lg' && 'text-2xl sm:text-3xl lg:text-4xl',
              size === 'xl' && 'text-3xl sm:text-4xl lg:text-5xl'
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              'text-sm lg:text-base xl:text-lg',
              size === 'lg' && 'text-base sm:text-lg lg:text-xl',
              size === 'xl' && 'text-lg sm:text-xl lg:text-2xl'
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size])}>
        {children}
      </CardContent>
    </Card>
  )
}
