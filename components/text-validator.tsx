'use client'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
interface TextValidatorProps {
  text: string
  textType?: 'script' | 'goal' | 'creative' | 'general'
  showRecommendations?: boolean
  className?: string
}
interface ValidationResult {
  status: 'error' | 'warning' | 'success' | 'info'
  message: string
  score: number
}
export function TextValidator({ 
  text, 
  textType = 'script', 
  showRecommendations = true,
  className = '' 
}: TextValidatorProps) {
  const getValidationRules = () => {
    switch (textType) {
      case 'script':
        return {
          minLength: 20,
          maxLength: 2000,
          optimalLength: [100, 500],
          keywords: ['купить', 'получить', 'заказать', 'звоните', 'скидка', 'акция', 'предложение'],
          structure: ['проблема', 'решение', 'выгода', 'действие']
        }
      case 'goal':
        return {
          minLength: 10,
          maxLength: 500,
          optimalLength: [30, 150],
          keywords: ['увеличить', 'повысить', 'улучшить', 'достичь', 'получить', 'конверсия'],
          structure: ['цель', 'метрика', 'срок']
        }
      case 'creative':
        return {
          minLength: 15,
          maxLength: 1000,
          optimalLength: [50, 300],
          keywords: ['креатив', 'дизайн', 'концепция', 'идея', 'образ'],
          structure: ['концепция', 'исполнение', 'результат']
        }
      default:
        return {
          minLength: 10,
          maxLength: 3000,
          optimalLength: [50, 800],
          keywords: [],
          structure: []
        }
    }
  }
  const validateText = (): ValidationResult[] => {
    const rules = getValidationRules()
    const results: ValidationResult[] = []
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (text.length < rules.minLength) {
      results.push({
        status: 'error',
        message: `Слишком короткий текст. Минимум ${rules.minLength} символов (сейчас: ${text.length})`,
        score: 0
      })
    } else if (text.length > rules.maxLength) {
      results.push({
        status: 'error',
        message: `Слишком длинный текст. Максимум ${rules.maxLength} символов (сейчас: ${text.length})`,
        score: 0
      })
    } else if (text.length < rules.optimalLength[0]) {
      results.push({
        status: 'warning',
        message: `Текст коротковат. Рекомендуемая длина: ${rules.optimalLength[0]}-${rules.optimalLength[1]} символов`,
        score: 60
      })
    } else if (text.length > rules.optimalLength[1]) {
      results.push({
        status: 'warning',
        message: `Текст длинноват. Рекомендуемая длина: ${rules.optimalLength[0]}-${rules.optimalLength[1]} символов`,
        score: 70
      })
    } else {
      results.push({
        status: 'success',
        message: `Оптимальная длина текста (${text.length} символов)`,
        score: 100
      })
    }
    if (sentences.length === 0) {
      results.push({
        status: 'error',
        message: 'Текст должен содержать хотя бы одно предложение',
        score: 0
      })
    } else if (sentences.length === 1) {
      results.push({
        status: 'warning',
        message: 'Добавьте больше предложений для лучшей структуры',
        score: 50
      })
    } else {
      results.push({
        status: 'success',
        message: `Хорошая структура: ${sentences.length} предложений`,
        score: 90
      })
    }
    if (textType === 'script' && rules.keywords.length > 0) {
      const foundKeywords = rules.keywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      )
      if (foundKeywords.length === 0) {
        results.push({
          status: 'warning',
          message: 'Добавьте призывы к действию (купить, заказать, получить и т.д.)',
          score: 40
        })
      } else {
        results.push({
          status: 'success',
          message: `Найдены призывы к действию: ${foundKeywords.join(', ')}`,
          score: 85
        })
      }
    }
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
    if (avgWordsPerSentence > 20) {
      results.push({
        status: 'warning',
        message: 'Предложения слишком длинные. Упростите для лучшей читаемости',
        score: 60
      })
    } else if (avgWordsPerSentence < 5) {
      results.push({
        status: 'warning',
        message: 'Предложения слишком короткие. Добавьте больше деталей',
        score: 65
      })
    } else {
      results.push({
        status: 'success',
        message: `Хорошая читаемость: ${Math.round(avgWordsPerSentence)} слов в предложении`,
        score: 90
      })
    }
    return results
  }
  const getOverallScore = (results: ValidationResult[]): number => {
    if (results.length === 0) return 0
    return Math.round(results.reduce((acc, result) => acc + result.score, 0) / results.length)
  }
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getScoreIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }
  const getRecommendations = (): string[] => {
    const rules = getValidationRules()
    const recommendations: string[] = []
    if (textType === 'script') {
      if (text.length < rules.optimalLength[0]) {
        recommendations.push('Добавьте больше деталей о продукте и его преимуществах')
        recommendations.push('Включите социальные доказательства (отзывы, статистику)')
        recommendations.push('Опишите проблему, которую решает ваш продукт')
      }
      if (!text.toLowerCase().includes('скидк') && !text.toLowerCase().includes('акци')) {
        recommendations.push('Рассмотрите добавление срочности (ограниченное время, количество)')
      }
      if (!text.includes('?')) {
        recommendations.push('Добавьте вопросы для вовлечения аудитории')
      }
    }
    if (textType === 'goal') {
      if (!text.toLowerCase().includes('увелич') && !text.toLowerCase().includes('повыс')) {
        recommendations.push('Сформулируйте цель как улучшение показателей')
      }
      if (!text.match(/\d+/)) {
        recommendations.push('Добавьте конкретные цифры и метрики')
      }
    }
    return recommendations
  }
  const validationResults = validateText()
  const overallScore = getOverallScore(validationResults)
  const recommendations = getRecommendations()
  if (!text.trim()) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Качество текста</span>
          <Badge variant="outline">Введите текст</Badge>
        </div>
      </div>
    )
  }
  return (
    <div className={`space-y-3 ${className}`}>
      {}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Качество текста</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${getScoreColor(overallScore)}`}>
            {overallScore}/100
          </span>
          <Badge variant={overallScore >= 80 ? 'default' : overallScore >= 60 ? 'secondary' : 'destructive'}>
            {overallScore >= 80 ? 'Отлично' : overallScore >= 60 ? 'Хорошо' : 'Требует улучшения'}
          </Badge>
        </div>
      </div>
      {}
      <Progress value={overallScore} className="h-2" />
      {}
      <div className="space-y-2">
        {validationResults.map((result, index) => (
          <Alert key={index} className="py-2">
            <div className="flex items-start gap-2">
              {getScoreIcon(result.status)}
              <AlertDescription className="text-xs">
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </div>
      {}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Рекомендации для улучшения:
          </h4>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-blue-800 flex items-start gap-1">
                <span className="text-blue-600 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      {}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>{text.length} символов</span>
        <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} слов</span>
        <span>{text.split(/[.!?]+/).filter(s => s.trim().length > 0).length} предложений</span>
      </div>
    </div>
  )
}
