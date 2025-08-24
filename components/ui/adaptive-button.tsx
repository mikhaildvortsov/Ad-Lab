import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, ReactNode } from "react"
import { Button } from "./button"

interface AdaptiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-4 py-3',
  lg: 'text-lg px-6 py-4 lg:px-8 lg:py-6',
  xl: 'text-xl px-8 py-6 lg:px-10 lg:py-8',
  '2xl': 'text-2xl px-10 py-8 lg:px-12 lg:py-10'
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10'
}

export function AdaptiveButton({ 
  children, 
  variant = 'default', 
  size = 'md',
  className,
  ...props 
}: AdaptiveButtonProps) {
  return (
    <Button 
      variant={variant}
      className={cn(
        sizeClasses[size],
        'font-medium transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export function AdaptiveIconButton({ 
  children, 
  variant = 'default', 
  size = 'md',
  className,
  ...props 
}: AdaptiveButtonProps) {
  return (
    <Button 
      variant={variant}
      className={cn(
        'p-2 lg:p-3 xl:p-4',
        'font-medium transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-xl active:scale-95 focus:scale-105 focus:shadow-lg',
        className
      )}
      {...props}
    >
      <div className={cn(iconSizes[size])}>
        {children}
      </div>
    </Button>
  )
}
