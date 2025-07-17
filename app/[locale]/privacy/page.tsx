"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowLeft } from "lucide-react"
import { useLocale } from "@/lib/use-locale"
import { useTranslation } from "@/lib/translations"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function PrivacyPolicyPage() {
  const { locale } = useLocale()
  const { t } = useTranslation(locale)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">{t('header.brand')}</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">
              {t('privacy.title')}
            </CardTitle>
            <div className="text-center text-gray-600">
              <p>{t('privacy.lastUpdated')}: 16 июля 2025 г.</p>
            </div>
          </CardHeader>
          
          <CardContent className="prose prose-lg max-w-none">
            <div className="space-y-8">
              {/* Общие положения */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.general.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.general.description')}</p>
                  <p>{t('privacy.general.contact')}</p>
                  <p>{t('privacy.general.compliance')}</p>
                </div>
              </section>

              {/* Сбор и обработка данных */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.dataCollection.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.dataCollection.description')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('privacy.dataCollection.personalData')}</li>
                    <li>{t('privacy.dataCollection.technicalData')}</li>
                    <li>{t('privacy.dataCollection.usageData')}</li>
                    <li>{t('privacy.dataCollection.paymentData')}</li>
                  </ul>
                </div>
              </section>

              {/* Цели обработки */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.purposes.title')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                  <li>{t('privacy.purposes.serviceProvision')}</li>
                  <li>{t('privacy.purposes.userSupport')}</li>
                  <li>{t('privacy.purposes.paymentProcessing')}</li>
                  <li>{t('privacy.purposes.serviceImprovement')}</li>
                  <li>{t('privacy.purposes.security')}</li>
                  <li>{t('privacy.purposes.legal')}</li>
                </ul>
              </section>

              {/* Правовые основания */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.legalBasis.title')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                  <li>{t('privacy.legalBasis.consent')}</li>
                  <li>{t('privacy.legalBasis.contract')}</li>
                  <li>{t('privacy.legalBasis.legitimate')}</li>
                  <li>{t('privacy.legalBasis.legal')}</li>
                </ul>
              </section>

              {/* Обработка платежей */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.payments.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.payments.description')}</p>
                  <p>{t('privacy.payments.tribute')}</p>
                  <p>{t('privacy.payments.security')}</p>
                </div>
              </section>

              {/* Передача данных */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.sharing.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.sharing.description')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('privacy.sharing.serviceProviders')}</li>
                    <li>{t('privacy.sharing.legal')}</li>
                    <li>{t('privacy.sharing.consent')}</li>
                  </ul>
                </div>
              </section>

              {/* Хранение данных */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.storage.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.storage.description')}</p>
                  <p>{t('privacy.storage.retention')}</p>
                </div>
              </section>

              {/* Права субъектов данных */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.rights.title')}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                  <li>{t('privacy.rights.access')}</li>
                  <li>{t('privacy.rights.rectification')}</li>
                  <li>{t('privacy.rights.erasure')}</li>
                  <li>{t('privacy.rights.restriction')}</li>
                  <li>{t('privacy.rights.portability')}</li>
                  <li>{t('privacy.rights.objection')}</li>
                  <li>{t('privacy.rights.withdraw')}</li>
                </ul>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.cookies.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.cookies.description')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('privacy.cookies.necessary')}</li>
                    <li>{t('privacy.cookies.analytics')}</li>
                  </ul>
                </div>
              </section>

              {/* Безопасность */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.security.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.security.description')}</p>
                  <p>{t('privacy.security.measures')}</p>
                </div>
              </section>

              {/* Контактная информация */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.contact.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.contact.description')}</p>
                  <p>{t('privacy.contact.response')}</p>
                </div>
              </section>

              {/* Изменения */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {t('privacy.changes.title')}
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('privacy.changes.description')}</p>
                  <p>{t('privacy.changes.notification')}</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="text-lg font-semibold">{t('header.brand')}</span>
          </div>
          <p className="text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  )
} 