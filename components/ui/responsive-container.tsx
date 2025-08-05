import { ReactNode } from "react"
import { cn } from "@/lib/utils"
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}
export function ResponsiveContainer({ 
  children, 
  className
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  )
}
export function ResponsiveSection({ 
  children, 
  className
}: ResponsiveContainerProps) {
  return (
    <section className={cn(
      "py-8 sm:py-12 lg:py-16",
      className
    )}>
      <ResponsiveContainer>
        {children}
      </ResponsiveContainer>
    </section>
  )
}
export function ResponsiveGrid({ 
  children, 
  className
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
      className
    )}>
      {children}
    </div>
  )
}
