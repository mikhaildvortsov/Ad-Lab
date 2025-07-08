"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLocale } from "@/lib/use-locale"
import { useRouter, usePathname } from "next/navigation"
import type { Locale } from "@/lib/i18n"
import { setStoredLocale } from "@/lib/locale-storage"
import { locales, defaultLocale } from "@/lib/i18n"

const languages = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
]

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { locale } = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const removeLocaleFromPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean)
    const firstSegment = segments[0]
    
    if (locales.includes(firstSegment as Locale)) {
      // Remove the locale segment
      const pathWithoutLocale = '/' + segments.slice(1).join('/')
      return pathWithoutLocale === '/' ? '/' : pathWithoutLocale
    }
    
    return path
  }

  const handleLanguageChange = (newLocale: Locale) => {
    // Save the language preference immediately
    setStoredLocale(newLocale)
    
    // Get the path without any locale
    const pathWithoutLocale = removeLocaleFromPath(pathname)
    
    // Build new path with the new locale
    let newPath: string
    if (newLocale === defaultLocale) {
      newPath = pathWithoutLocale
    } else {
      newPath = `/${newLocale}${pathWithoutLocale}`
    }
    
    router.push(newPath)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2 sm:gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code as Locale)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">{language.flag}</span>
            <span className="text-sm">{language.name}</span>
            {language.code === locale && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 