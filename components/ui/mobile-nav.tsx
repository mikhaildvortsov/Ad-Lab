"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, User, LogOut, Home, Sparkles, Bot } from "lucide-react"
import { useLocale } from "@/lib/use-locale"
interface User {
  id: string
  name: string
  email: string
  image?: string
}
interface MobileNavProps {
  user: User | null
  onLogout: () => void
  t: (key: string) => string
}
export function MobileNav({ user, onLogout, t }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { locale } = useLocale()
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">Ad Lab</span>
          </div>
          <nav className="flex-1 space-y-4">
            <Link 
              href={`/${locale}`}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-4 w-4" />
              Главная
            </Link>
            {user ? (
              <>
                <Link 
                  href={`/${locale}/dashboard`}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Личный кабинет
                </Link>
                <Link 
                  href={`/${locale}/pricing`} 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Sparkles className="h-4 w-4" />
                  {t('header.pricing')}
                </Link>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      console.log('MobileNav: Logout button clicked')
                      onLogout()
                      setIsOpen(false)
                    }}
                    className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-4">
                <Link href={`/${locale}/auth?mode=login`} onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Войти
                  </Button>
                </Link>
                <Link href={`/${locale}/auth?mode=register`} onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
