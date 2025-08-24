"use client"

import { Container, Section, Heading1, Heading2, Heading3, BodyLarge, BodyMedium, BodySmall, AdaptiveButton, AdaptiveCard } from "@/components/ui"
import { Sparkles, Target, Zap, TrendingUp, ArrowRight } from "lucide-react"

export default function AdaptiveDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <Container size="wide" className="py-4 sm:py-6 lg:py-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Адаптивные компоненты - Демо
            </span>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <Section containerSize="wide" padding="xxlarge">
        <div className="text-center max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          <Heading1>
            Демонстрация{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              адаптивных компонентов
            </span>
          </Heading1>
          <BodyLarge className="max-w-3xl lg:max-w-4xl mx-auto">
            Посмотрите, как новые компоненты адаптируются к разным размерам экранов, включая большие мониторы 2560x1440
          </BodyLarge>
        </div>
      </Section>

      {/* Typography Demo */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <Heading2>Типографика</Heading2>
          <BodyMedium>Адаптивные заголовки и текст для всех размеров экранов</BodyMedium>
        </div>

        <div className="space-y-8 lg:space-y-12">
          <div className="text-center">
            <Heading1>Заголовок 1</Heading1>
            <BodyLarge>Большой текст для описания</BodyLarge>
          </div>
          
          <div className="text-center">
            <Heading2>Заголовок 2</Heading2>
            <BodyMedium>Средний текст для подзаголовков</BodyMedium>
          </div>
          
          <div className="text-center">
            <Heading3>Заголовок 3</Heading3>
            <BodySmall>Малый текст для деталей</BodySmall>
          </div>
        </div>
      </Section>

      {/* Buttons Demo */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <Heading2>Кнопки</Heading2>
          <BodyMedium>Адаптивные кнопки разных размеров</BodyMedium>
        </div>

        <div className="flex flex-col items-center gap-6 lg:gap-8">
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
            <AdaptiveButton size="sm">Маленькая</AdaptiveButton>
            <AdaptiveButton size="md">Средняя</AdaptiveButton>
            <AdaptiveButton size="lg">Большая</AdaptiveButton>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
            <AdaptiveButton size="xl" variant="outline">
              <Target className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
              Очень большая
            </AdaptiveButton>
            <AdaptiveButton size="2xl" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <ArrowRight className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              Огромная
            </AdaptiveButton>
          </div>
        </div>
      </Section>

      {/* Cards Demo */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <Heading2>Карточки</Heading2>
          <BodyMedium>Адаптивные карточки с разными размерами</BodyMedium>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          <AdaptiveCard size="sm" hover>
            <div className="text-center">
              <Target className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600 mx-auto mb-3" />
              <Heading3>Маленькая</Heading3>
              <BodySmall>Карточка с малым размером</BodySmall>
            </div>
          </AdaptiveCard>
          
          <AdaptiveCard size="md" hover>
            <div className="text-center">
              <Zap className="h-8 w-8 lg:h-10 lg:w-10 text-purple-600 mx-auto mb-3" />
              <Heading3>Средняя</Heading3>
              <BodySmall>Карточка со средним размером</BodySmall>
            </div>
          </AdaptiveCard>
          
          <AdaptiveCard size="lg" hover>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 text-green-600 mx-auto mb-3" />
              <Heading3>Большая</Heading3>
              <BodySmall>Карточка с большим размером</BodySmall>
            </div>
          </AdaptiveCard>
          
          <AdaptiveCard size="xl" hover>
            <div className="text-center">
              <Sparkles className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600 mx-auto mb-3" />
              <Heading3>Очень большая</Heading3>
              <BodySmall>Карточка с очень большим размером</BodySmall>
            </div>
          </AdaptiveCard>
        </div>
      </Section>

      {/* Container Demo */}
      <Section containerSize="wide" padding="xlarge">
        <div className="text-center mb-12 lg:mb-16">
          <Heading2>Контейнеры</Heading2>
          <BodyMedium>Разные размеры контейнеров для разных целей</BodyMedium>
        </div>

        <div className="space-y-8 lg:space-y-12">
          <Container size="narrow" className="bg-blue-100 p-6 rounded-lg">
            <Heading3>Узкий контейнер</Heading3>
            <BodySmall>Максимальная ширина 5xl (80rem)</BodySmall>
          </Container>
          
          <Container size="default" className="bg-green-100 p-6 rounded-lg">
            <Heading3>Обычный контейнер</Heading3>
            <BodySmall>Максимальная ширина 7xl (80rem)</BodySmall>
          </Container>
          
          <Container size="wide" className="bg-purple-100 p-6 rounded-lg">
            <Heading3>Широкий контейнер</Heading3>
            <BodySmall>Максимальная ширина 8xl (88rem)</BodySmall>
          </Container>
          
          <Container size="ultra-wide" className="bg-orange-100 p-6 rounded-lg">
            <Heading3>Очень широкий контейнер</Heading3>
            <BodySmall>Максимальная ширина 9xl (96rem)</BodySmall>
          </Container>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 lg:py-16">
        <Container size="wide" className="text-center">
          <div className="flex items-center justify-center gap-2 lg:gap-4 mb-4 lg:mb-6">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            <span className="text-base sm:text-lg lg:text-xl font-semibold">
              Адаптивные компоненты
            </span>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400">
            Демонстрация возможностей для всех размеров экранов
          </p>
        </Container>
      </footer>
    </div>
  )
}
