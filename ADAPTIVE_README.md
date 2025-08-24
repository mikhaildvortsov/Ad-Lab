# Адаптивные компоненты для больших экранов

Этот документ описывает новые адаптивные компоненты, созданные для улучшения отображения сайта на всех размерах экранов, включая большие мониторы 2560x1440.

## Новые breakpoints

Добавлены новые breakpoints в `tailwind.config.ts`:

- `xs`: 475px
- `sm`: 640px  
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Новые CSS утилиты

В `globals.css` добавлены адаптивные утилиты:

### Типографика
- `.text-responsive-xs` - от xs до sm
- `.text-responsive-sm` - от sm до lg
- `.text-responsive-base` - от base до xl
- `.text-responsive-lg` - от lg до 2xl
- `.text-responsive-xl` - от xl до 4xl
- `.text-responsive-2xl` - от 2xl до 5xl
- `.text-responsive-3xl` - от 3xl до 6xl
- `.text-responsive-4xl` - от 4xl до 7xl

### Контейнеры
- `.container-responsive` - max-w-7xl
- `.container-wide` - max-w-8xl
- `.container-ultra-wide` - max-w-9xl

### Сетки
- `.grid-responsive-1` до `.grid-responsive-6`
- `.spacing-responsive` - адаптивные отступы
- `.padding-responsive` - адаптивные padding
- `.margin-responsive` - адаптивные margin
- `.gap-responsive` - адаптивные gap

## Новые компоненты

### Container
```tsx
import { Container } from "@/components/ui/container"

<Container size="wide">
  <h1>Контент</h1>
</Container>
```

Размеры:
- `default` - max-w-7xl
- `wide` - max-w-8xl
- `ultra-wide` - max-w-9xl
- `narrow` - max-w-5xl

### Section
```tsx
import { Section } from "@/components/ui/section"

<Section containerSize="wide" padding="xlarge">
  <h1>Секция</h1>
</Section>
```

Размеры контейнера: те же, что и у Container
Размеры padding:
- `small` - py-8 до py-12
- `medium` - py-12 до py-20
- `large` - py-16 до py-28
- `xlarge` - py-20 до py-32
- `xxlarge` - py-24 до py-36

### Typography
```tsx
import { Heading1, BodyLarge } from "@/components/ui/typography"

<Heading1>Заголовок 1</Heading1>
<BodyLarge>Большой текст</BodyLarge>
```

Компоненты:
- `Heading1` - h1 с адаптивными размерами
- `Heading2` - h2 с адаптивными размерами
- `Heading3` - h3 с адаптивными размерами
- `BodyLarge` - большой текст
- `BodyMedium` - средний текст
- `BodySmall` - маленький текст

### AdaptiveButton
```tsx
import { AdaptiveButton } from "@/components/ui/adaptive-button"

<AdaptiveButton size="xl" variant="outline">
  Кнопка
</AdaptiveButton>
```

Размеры:
- `sm` - text-sm px-3 py-2
- `md` - text-base px-4 py-3
- `lg` - text-lg px-6 py-4 до px-8 py-6
- `xl` - text-xl px-8 py-6 до px-10 py-8
- `2xl` - text-2xl px-10 py-8 до px-12 py-10

### AdaptiveCard
```tsx
import { AdaptiveCard } from "@/components/ui/adaptive-card"

<AdaptiveCard size="lg" hover>
  <h3>Заголовок карточки</h3>
  <p>Содержимое</p>
</AdaptiveCard>
```

Размеры:
- `sm` - p-4 до p-6
- `md` - p-6 до p-10
- `lg` - p-8 до p-12
- `xl` - p-10 до p-16

## Примеры использования

### Hero секция
```tsx
<Section containerSize="wide" padding="xxlarge">
  <div className="text-center max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
    <Heading1>
      Заголовок
    </Heading1>
    <BodyLarge>
      Описание
    </BodyLarge>
  </div>
</Section>
```

### Сетка карточек
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
  <AdaptiveCard size="lg" hover>
    <h3>Карточка 1</h3>
  </AdaptiveCard>
  <AdaptiveCard size="lg" hover>
    <h3>Карточка 2</h3>
  </AdaptiveCard>
</div>
```

### Адаптивные кнопки
```tsx
<div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
  <AdaptiveButton size="xl">
    Основная кнопка
  </AdaptiveButton>
  <AdaptiveButton size="xl" variant="outline">
    Вторичная кнопка
  </AdaptiveButton>
</div>
```

## Преимущества

1. **Лучшее использование пространства** - контент масштабируется на больших экранах
2. **Консистентность** - единый подход к адаптивности
3. **Переиспользование** - компоненты можно использовать по всему проекту
4. **Простота** - легко изменять размеры и отступы
5. **Производительность** - оптимизированные CSS классы

## Миграция

Для миграции существующего кода:

1. Замените `container mx-auto` на `<Container>`
2. Замените секции на `<Section>`
3. Используйте адаптивные компоненты вместо обычных
4. Применяйте новые CSS утилиты для типографики и отступов
