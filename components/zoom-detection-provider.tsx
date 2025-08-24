'use client'

import { useEffect, ReactNode } from 'react'

interface ZoomDetectionProviderProps {
  children: ReactNode
}

export function ZoomDetectionProvider({ children }: ZoomDetectionProviderProps) {
  useEffect(() => {
    const detectZoom = () => {
      let zoom = 1
      
      // Определяем масштаб браузера через devicePixelRatio
      if (window.devicePixelRatio) {
        zoom = window.devicePixelRatio
      }
      
      // Для Chrome через innerWidth/outerWidth
      if (window.outerWidth && window.innerWidth) {
        const zoomByWidth = window.outerWidth / window.innerWidth
        if (zoomByWidth > 0 && zoomByWidth < 3) {
          zoom = zoomByWidth
        }
      }
      
      // Для мобильных через visualViewport
      if ('visualViewport' in window && window.visualViewport) {
        const visualZoom = window.visualViewport.scale
        if (visualZoom > 0 && visualZoom < 3) {
          zoom = visualZoom
        }
      }
      
      // Определяем категорию масштаба
      let zoomCategory = 'normal'
      if (zoom >= 1 && zoom < 1.5) {
        zoomCategory = 'normal'
      } else if (zoom >= 1.5 && zoom < 2) {
        zoomCategory = 'high'
      } else if (zoom >= 2 && zoom < 2.5) {
        zoomCategory = 'very-high'
      } else {
        zoomCategory = 'extreme'
      }
      
      // Добавляем CSS класс для применения стилей
      document.documentElement.classList.remove('zoom-normal', 'zoom-high', 'zoom-very-high', 'zoom-extreme')
      document.documentElement.classList.add(`zoom-${zoomCategory}`)
      
      // Добавляем дополнительные CSS переменные для более точного контроля
      document.documentElement.style.setProperty('--zoom-level', zoom.toString())
      document.documentElement.style.setProperty('--zoom-category', zoomCategory)
      
      console.log(`Zoom detected: ${zoom} (${zoomCategory})`)
    }

    // Применяем при загрузке
    detectZoom()

    // Слушаем изменения размера окна
    const handleResize = () => {
      setTimeout(detectZoom, 100)
    }

    // Слушаем изменения масштаба
    const handleZoom = () => {
      setTimeout(detectZoom, 50)
    }

    window.addEventListener('resize', handleResize)
    
    // Для Chrome слушаем изменения zoom
    if ('chrome' in window) {
      window.addEventListener('zoom', handleZoom)
    }

    // Слушаем изменения visualViewport
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleZoom)
      window.visualViewport.addEventListener('scroll', handleZoom)
    }

    // Слушаем изменения devicePixelRatio
    if ('matchMedia' in window) {
      const mediaQuery = window.matchMedia('(resolution: 1dppx)')
      mediaQuery.addEventListener('change', detectZoom)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if ('chrome' in window) {
        window.removeEventListener('zoom', handleZoom)
      }
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleZoom)
        window.visualViewport.removeEventListener('scroll', handleZoom)
      }
      if ('matchMedia' in window) {
        const mediaQuery = window.matchMedia('(resolution: 1dppx)')
        mediaQuery.removeEventListener('change', detectZoom)
      }
    }
  }, [])

  return <>{children}</>
}
